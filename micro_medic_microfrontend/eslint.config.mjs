// @ts-check
/**
 * One flat config for the whole monorepo.
 *
 * A single root config rather than one per package, deliberately: the rules that matter here are
 * *cross-package* conventions (no deep imports between micro-frontends, no `console` in shipped
 * code, no raw `mm-` tags), and those cannot be enforced from inside the package they constrain.
 * Per-package configs would also drift — this repo already has three eras of tooling in it.
 *
 * The interesting part is the layering. Flat config applies blocks in order, later `rules`
 * winning, so this file reads top to bottom as "everything, then TS, then React, then the
 * exceptions". The legacy plain-JS packages are NOT exempted from correctness rules, only from
 * the modern-syntax ones they predate — the point of linting a mid-migration codebase is to stop
 * the old style spreading, not to freeze it.
 *
 * Type-aware linting (`projectService`) is on for the TS packages, which is what makes rules like
 * `no-floating-promises` possible. It costs a real typecheck per run, so it is scoped to `**\/*.ts`
 * and `**\/*.tsx` rather than applied globally.
 */

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    {
        // Build output and vendored code. `dist` is per-package here, hence the `**` prefix.
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            '**/coverage/**',
            // Svelte needs its own parser to be linted at all; adding one for a single legacy
            // component would pull a plugin whose only job is to lint code we intend to replace.
            '**/*.svelte',
        ],
    },

    // ------------------------------------------------------------------ every file
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                // The debug flag the event bus reads, set from the console at runtime.
                __MICRO_MEDIC_DEBUG__: 'readonly',
            },
        },
        rules: {
            /*
             * `console.warn`/`console.error` are how this codebase reports degraded states it
             * cannot otherwise surface (a corrupt persisted user, a failed `persist()`), so they
             * stay. `console.log`/`console.debug` are debugging leftovers — except in the two
             * standalone harnesses, exempted below.
             */
            'no-console': ['warn', { allow: ['warn', 'error'] }],

            // Catches the class of bug that produced `store.authToken === undefined` in the
            // legacy packages: a typo'd or renamed import that only fails at runtime.
            'no-undef': 'error',

            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-var': 'error',
            'prefer-const': 'error',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        },
    },

    // ------------------------------------------------------------------ TypeScript
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: [
            ...tseslint.configs.recommended,
            // Type-aware rules. These are the ones worth the typecheck cost.
            ...tseslint.configs.recommendedTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                // Resolves each file to its own package's tsconfig, which is required here:
                // the packages have genuinely different compiler settings (JSX, Angular
                // decorators, DOM libs) and one shared program would mis-check most of them.
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // `no-undef` is redundant under TS and produces false positives on type-only
            // globals, which is why typescript-eslint recommends disabling it.
            'no-undef': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],

            /*
             * The rule that earns its keep in this codebase. Every mutation and query here
             * returns a promise, and a dropped `await` on `refreshUser()` or a mutation is a
             * silent no-op — the UI just never updates and nothing is logged.
             */
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/await-thenable': 'error',

            // `unknown` in a `catch` is the convention already followed by `error-message.ts`
            // and the auth hooks; this stops a stray `any` from creeping in.
            '@typescript-eslint/no-explicit-any': 'warn',

            /*
             * Off, not warn. The design system and the shared store both need real assertions
             * to talk to the platform: `globalThis as typeof globalThis & { __MM__?: X }` for the
             * federation dedupe, and `(e as CustomEvent).detail` in the bus, where the DOM types
             * genuinely cannot express what the code knows.
             */
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',

            // Prefer the `import type` the codebase already uses — it matters under
            // `isolatedModules`, where a value import of a type is a runtime import of nothing.
            '@typescript-eslint/consistent-type-imports': [
                'warn',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],

            /*
             * A promise-returning handler passed to `onSubmit`/`onClick` is the normal shape of
             * every form in this app: react-hook-form's `handleSubmit(fn)` returns
             * `(e) => Promise<void>`, and there is nothing useful to do with that promise —
             * rejection is already surfaced through the mutation's `error` state and rendered.
             * The rule cannot distinguish that from a genuinely dropped promise, and here it is
             * wrong at every one of its nine sites.
             */
            '@typescript-eslint/no-misused-promises': [
                'error',
                { checksVoidReturn: false },
            ],

            /*
             * Off for a Lit-specific reason. `@click=${this.onClick}` looks like an unbound
             * method extraction, but Lit's event-part binding calls listeners with the host
             * element as `this` (it passes the host as the listener's `options.host`), so every
             * one of the 17 reports is a false positive against the framework's own contract.
             * The alternative — annotating every private render helper `this: void` or wrapping
             * each in an arrow — would add noise to make a linter agree with itself.
             */
            '@typescript-eslint/unbound-method': 'off',
        },
    },

    // ------------------------------------------------------------------ React
    {
        /*
         * `.tsx` only. This block used to include `packages/nav/src/**\/*.js` and
         * `packages/home/src/**\/*.js` for legacy JSX in plain-JS files; there is none left — `nav`
         * is TypeScript custom elements now, the shell is three files of plain JS with no markup in
         * them, and `icd10` builds its DOM from template strings. A `files` pattern matching nothing
         * is not an error, so this would have gone unnoticed indefinitely.
         */
        files: ['**/*.tsx'],
        plugins: { react, 'react-hooks': reactHooks },
        settings: {
            // `detect` reads whichever React is resolvable from the linted file. React 19 is the
            // only one left in a linted package, but leaving this on `detect` costs nothing and is
            // what keeps a future MFE on a different version honest.
            react: { version: 'detect' },
        },
        rules: {
            ...react.configs.flat.recommended.rules,
            ...reactHooks.configs.recommended.rules,

            // Every React package is on the automatic JSX runtime (`jsx: react-jsx`), so `React`
            // does not need to be in scope and these two rules are actively wrong.
            'react/react-in-jsx-scope': 'off',
            'react/jsx-uses-react': 'off',

            // Props are typed by TS, which is what `prop-types` exists to approximate.
            'react/prop-types': 'off',

            /*
             * The rule this codebase most needs, given how much of it is imperative-store
             * bridging: `useEffect(() => authStore.subscribe(setState), [])` is only correct
             * because `subscribe` returns its own teardown, and every other effect here has a
             * dependency array that must stay honest.
             */
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/rules-of-hooks': 'error',

            // Unescaped entities in JSX text are a real source of mojibake, but the messages in
            // this app contain apostrophes; the transform escapes them correctly.
            'react/no-unescaped-entities': 'off',
        },
    },

    // ------------------------------------------------------------------ exceptions
    {
        /*
         * The standalone dev harnesses exist to print bus traffic and auth state to the console —
         * that IS their function, so `no-console` would be inverted here. They are never part of
         * a federated build (webpack only reaches them from `bootstrap-standalone`).
         */
        files: ['**/standalone.ts', '**/standalone.tsx', '**/bootstrap-standalone.ts'],
        rules: { 'no-console': 'off' },
    },
    {
        /*
         * The event bus is the one place a `console.debug` is a feature: every call is behind
         * `isDebug()`, which reads `window.__MICRO_MEDIC_DEBUG__` per call so a developer can
         * switch cross-MFE message tracing on from the console at runtime. That tracing is the
         * only way to observe the pub/sub layer — there is no other seam between publisher and
         * subscriber — so this is opt-in instrumentation, not a debugging leftover.
         */
        files: ['packages/shared-store/src/event-bus.ts'],
        rules: { 'no-console': 'off' },
    },
    {
        // Build scripts and configs are Node, not browser, and are CommonJS.
        files: ['**/webpack.config.js', '**/*.cjs', '**/.eslintrc.cjs'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: { ...globals.node },
        },
        rules: { 'no-console': 'off' },
    },
    {
        // Ambient declaration files are all types; the "unused" vars in them are the exports.
        files: ['**/*.d.ts'],
        rules: { '@typescript-eslint/no-unused-vars': 'off' },
    },

    /*
     * Last, so it wins: turns off every rule that only expresses formatting. Formatting is
     * Prettier's job here, and a rule that both tools have an opinion about is a rule that
     * produces a fight in CI.
     */
    prettier
);
