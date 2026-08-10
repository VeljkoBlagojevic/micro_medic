/**
 * Ambient declarations for the two non-TypeScript things this package imports.
 *
 * `*.vue` — `vue-tsc` understands SFCs natively, but plain `tsc` (and any editor falling back to it)
 * does not, and neither does the type-aware ESLint pass. Without this, every
 * `import ICD10App from './ICD10App.vue'` is TS2307. The `DefineComponent<{}, {}, any>` shape is the
 * standard shim: `vue-tsc` overrides it with the component's real inferred type, so the loose
 * generics never weaken the checking that matters.
 *
 * `*.css` — webpack turns `import './styles.css'` into a `<style>` tag via style-loader; TypeScript
 * has no idea what a stylesheet is and rejects the specifier (TS2882). Mirrors
 * `examination/src/src.d.ts` and `auth/src/css.d.ts`.
 */

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module '*.css' {
    const content: string;
    export default content;
}
