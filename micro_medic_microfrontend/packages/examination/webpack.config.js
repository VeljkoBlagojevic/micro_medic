const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const { AngularWebpackPlugin, AngularWebpackLoaderPath } = require('@ngtools/webpack');

// `--mode production` (what `yarn build` passes) overrides a config's `mode`, but *not* an explicit
// `optimization.minimize: false` — not being a mode default, that block survived every production
// build, so every remote had been shipping unminified. Both settings derive from the one flag now.
const isProd = (argv) => argv.mode === 'production';

/**
 * The Angular micro-frontend, and the third framework on this screen.
 *
 * `/examination` composes two independently deployed feature remotes side by side: this Angular
 * form (3/4 of the width) and the plain-JavaScript ICD-10 catalogue beside it (1/4). Nothing here
 * imports another micro-frontend — the only coupling is the event bus and the `mm-*` design
 * system, both framework-agnostic on purpose.
 */
module.exports = (_env, argv) => ({
  entry: './src/bootstrap-standalone',
  cache: false,

  mode: isProd(argv) ? 'production' : 'development',
  devtool: isProd(argv) ? false : 'source-map',

  output: {
    // `auto`, not a literal origin: derived from `document.currentScript.src` when
    // remoteEntry.js executes, so the container works on whatever host serves it.
    publicPath: 'auto',
    // Immutable chunks behind a stable `remoteEntry.js`: ModuleFederationPlugin's own `filename`
    // wins for the container entry, so the shell holds one URL per remote while everything behind
    // it can be cached forever. Production only — `[contenthash]` and HMR do not mix.
    chunkFilename: isProd(argv) ? '[name].[contenthash].js' : '[name].js',
    clean: isProd(argv)
  },

  resolve: {
    extensions: ['.ts', '.js', '.json'],
    // `moduleResolution: nodenext` makes tsc demand a `.js` extension on relative ESM imports
    // (TS2835) even when the file is `.ts`. This maps the specifier back to the real source so
    // both tools agree — the same rule `calendar` and `auth` follow.
    extensionAlias: {
      '.js': ['.ts', '.js']
    }
  },

  module: {
    rules: [
      /*
       * AOT, via the Angular compiler rather than a plain transpiler.
       *
       * `ts-loader` (what `calendar` and `auth` use) would compile the TypeScript but never look
       * at a template, so every `mm-*` binding would go unchecked and the whole argument for
       * `design-system-angular` — that `[oepn]="true"` is a build error rather than a runtime
       * shrug — would be lost. It would also leave templates to be compiled in the browser,
       * which means shipping `@angular/compiler` to every visitor.
       */
      {
        test: /\.[cm]?[jt]sx?$/,
        loader: AngularWebpackLoaderPath
      },
      // This MFE's own namespaced stylesheet only. The document-wide theme (tokens.css +
      // global.css) is the shell's job — two remotes shipping a reset is the classic
      // micro-frontend CSS collision, and whichever loads second silently wins.
      {
        test: /\.css$/i,
        use: [require.resolve('style-loader'), require.resolve('css-loader')]
      }
    ]
  },

  plugins: [
    new AngularWebpackPlugin({
      tsconfig: './tsconfig.json',
      jitMode: false
    }),

    new ModuleFederationPlugin({
      name: 'examination',
      library: { type: 'var', name: 'examination' },
      filename: 'remoteEntry.js',
      exposes: {
        // Capital E — the file is `src/Examination.ts`. A lowercase path resolves on Windows but
        // fails on a case-sensitive filesystem (i.e. CI and Linux containers).
        './Examination': './src/Examination'
      },
      shared: {
        /*
         * Angular is shared as a singleton: two copies of `@angular/core` in one document means
         * two independent dependency-injection platforms, and a directive from one cannot be
         * resolved by the other — the failure mode is an `mm-input` that renders but never binds.
         * Right now this is the only Angular remote, so the shared scope has exactly one
         * candidate; the declaration is what keeps a second Angular MFE from silently
         * duplicating the framework.
         */
        '@angular/core': { singleton: true, requiredVersion: '^22.1.0' },
        '@angular/common': { singleton: true, requiredVersion: '^22.1.0' },
        '@angular/forms': { singleton: true, requiredVersion: '^22.1.0' },
        '@angular/platform-browser': { singleton: true, requiredVersion: '^22.1.0' },
        rxjs: { singleton: true, requiredVersion: '^7.8.2' },

        /*
         * `single-spa` is absent entirely — this package imports it nowhere. Its lifecycles are
         * hand-written (see `src/Examination.ts`'s `createApplication` + `createComponent`),
         * which already returns exactly the promise-returning mount/unmount pair single-spa asks
         * for, so there is no adapter to share a dependency with in the first place.
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
        '@micro-medic/design-system': { singleton: true, requiredVersion: '^1.0.0' },
        // Holds the binding directives, which register nothing themselves but resolve against
        // the element classes above — the two have to come from the same copy.
        '@micro-medic/design-system-angular': { singleton: true, requiredVersion: '^1.0.0' }
      }
    }),

    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
});
