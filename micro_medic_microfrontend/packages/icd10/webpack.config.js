const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const { VueLoaderPlugin } = require('vue-loader');

/**
 * The Vue micro-frontend — the narrow (1/4) pane of the `/examination` horizontal split.
 *
 * Its sibling on that screen is `examination`, an Angular application on another port; `calendar`
 * is React 19, the design system is Lit and `nav`/`notifications` are plain custom elements. Nothing
 * here imports another micro-frontend. The only coupling is the event bus and the `mm-*` elements,
 * both framework-agnostic on purpose.
 *
 * Note what this file does *not* contain: there is no `@micro-medic/design-system-vue` in the
 * shared list, because no such package exists. Vue 3 sets a non-primitive binding as a DOM
 * *property* on an unknown element and registers a `@mm-input` listener with `addEventListener`, so
 * the `mm-*` elements need no binding layer at all — only the `isCustomElement` predicate below and
 * the ambient types in `src/types/design-system.d.ts`. `design-system-react` exists because React
 * has no prop for a custom event; `design-system-angular` exists so `strictTemplates` can check
 * bindings without `CUSTOM_ELEMENTS_SCHEMA` switching template checking off wholesale. Neither
 * defect applies to Vue, and the spectrum of integration costs across the four frameworks
 * (nothing → one predicate → one package → eleven directives) is a result of the project rather than
 * an inconsistency in it.
 */
module.exports = {
  entry: './src/bootstrap-standalone',
  cache: false,

  mode: 'development',
  devtool: 'source-map',

  optimization: {
    minimize: false
  },

  output: {
    publicPath: 'http://localhost:3002/'
  },

  devServer: {
    port: 3002,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },

  resolve: {
    extensions: ['.ts', '.vue', '.js', '.json'],
    // `moduleResolution: nodenext` makes tsc demand a `.js` extension on relative ESM imports
    // (TS2835) even when the file is `.ts`. This maps the specifier back to the real source so
    // both tools agree — the same rule `calendar`, `auth` and `examination` follow. `.vue`
    // specifiers carry their real extension and need no alias.
    extensionAlias: {
      '.js': ['.ts', '.js']
    }
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: require.resolve('vue-loader'),
        options: {
          compilerOptions: {
            /*
             * The one line of build configuration Vue needs to consume the design system.
             *
             * Without it the compiler treats `<mm-button>` as an unresolved *component* and warns
             * on every render; with it, the tag is emitted as an element, which is what lets Vue
             * set `.options`/`.rows` as properties and bind `@mm-input` as a real event listener.
             *
             * It has to be here rather than in `app.config.compilerOptions`: templates in SFCs are
             * pre-compiled at build time, so the runtime compiler options are never consulted and
             * setting `isCustomElement` on the app instance would be silently ignored.
             *
             * The prefix test is deliberately not a list of the eleven tags. A design system that
             * gains a component should not need a build change in every consumer, and `mm-` is
             * already the reserved prefix — `defineElement` guards the registry, so a genuine typo
             * like `<mm-buton>` fails as an unknown element at runtime and, more usefully, fails
             * `vue-tsc` at build time because it has no `GlobalComponents` declaration.
             */
            isCustomElement: (tag) => tag.startsWith('mm-')
          }
        }
      },
      {
        /*
         * `ts-loader`, as in `calendar` and `auth`, rather than the Angular-style AOT plugin —
         * `vue-loader` has already turned each `<template>` into a render function by the time
         * this runs, so templates are compiled at build time either way. `vue-tsc` is what
         * type-checks them (see the `typecheck` script), which is the same division of labour as
         * `examination`: the bundler compiles, a separate tool checks.
         *
         * `appendTsSuffixTo` is required, not optional: `vue-loader` hands the `<script lang="ts">`
         * block on as a request ending in `.vue`, and ts-loader refuses to compile a file whose
         * extension it does not recognise.
         */
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: require.resolve('ts-loader'),
        options: {
          appendTsSuffixTo: [/\.vue$/],
          transpileOnly: true,
          compilerOptions: {
            noEmit: false
          }
        }
      },
      // This MFE's own namespaced stylesheet only. It must never ship a reset or the `--mm-*`
      // tokens: those are document-wide and the shell owns them. Two remotes each shipping a reset
      // is the classic micro-frontend CSS collision, and whichever loads second silently wins.
      {
        test: /\.css$/i,
        use: [require.resolve('style-loader'), require.resolve('css-loader')]
      }
    ]
  },

  plugins: [
    // Splits each SFC into its script/template/style requests and applies the rules above to
    // them. Without it, `vue-loader` is registered but never actually processes a block.
    new VueLoaderPlugin(),

    /*
     * Vue reads three compile-time flags and warns at runtime when they are missing from the
     * bundle. `__VUE_OPTIONS_API__: false` is the one with teeth: every component here is
     * `<script setup>` Composition API, so the Options API compatibility layer is dead weight in a
     * fragment that is downloaded on one route.
     */
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: JSON.stringify(false),
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
    }),

    new ModuleFederationPlugin({
      name: 'icd10',
      library: { type: 'var', name: 'icd10' },
      filename: 'remoteEntry.js',
      /*
       * No `remotes` block any more, and that is the debt this rewrite paid off.
       *
       * The previous plain-JS implementation consumed the auth store as the `shared_store`
       * *remote*, because it had no ts-loader and could not import raw TypeScript. It then
       * hand-built its own `Authorization` header against a local `API_BASE` constant. This
       * package imports `@micro-medic/shared-store` and `@micro-medic/api-client` as sources
       * through the `paths` map in `tsconfig.base.json`, exactly as `examination` and `calendar`
       * do, and declares them as singletons below so every copy resolves to one instance.
       */
      exposes: {
        // Capital ICD10 — the file is `src/ICD10.ts`. A lowercase path resolves on Windows but
        // fails on a case-sensitive filesystem (i.e. CI and Linux containers).
        './ICD10': './src/ICD10'
      },
      shared: {
        /*
         * Vue as a singleton, for the same reason `examination` shares `@angular/core`: two copies
         * in one document is two independent reactivity systems, and a `ref` created by one is an
         * inert object to the other. Today this is the only Vue remote, so the shared scope has
         * exactly one candidate — the declaration is what stops a second Vue MFE from silently
         * duplicating the framework.
         */
        vue: { singleton: true, requiredVersion: '^3.5.22' },

        /*
         * `single-spa` is deliberately absent. The shell is on v5 and the modern MFEs are on v6,
         * and this package imports it nowhere: its lifecycles are hand-written (see `src/ICD10.ts`),
         * because `createApp().mount()`/`unmount()` is already the promise-free pair single-spa
         * asks for.
         */
        lit: { singleton: true, requiredVersion: '^3.3.3' },
        axios: { singleton: true },
        // These must be singletons: the auth store holds the token every other MFE reads, and a
        // second copy of the design system would find every `mm-*` tag already defined — its
        // component classes would then never be used, so whichever remote loaded first silently
        // owns the components.
        '@micro-medic/shared-store': { singleton: true, requiredVersion: '^1.0.0' },
        '@micro-medic/shared-types': { singleton: true, requiredVersion: '^1.0.0' },
        '@micro-medic/api-client': { singleton: true, requiredVersion: '^1.0.0' },
        '@micro-medic/design-system': { singleton: true, requiredVersion: '^1.0.0' }
      }
    }),

    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
};
