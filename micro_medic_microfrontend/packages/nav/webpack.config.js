const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

// `--mode production` (what `yarn build` passes) overrides a config's `mode`, but *not* an explicit
// `optimization.minimize: false` — not being a mode default, that block survived every production
// build, so every remote had been shipping unminified. Both settings derive from the one flag now.
const isProd = (argv) => argv.mode === 'production';

module.exports = (_env, argv) => ({
  // The standalone harness, not one of the exposed modules: `entry` builds the page served on
  // :3003 for development, while `exposes` below is what the shell consumes. The dynamic import
  // inside it forces an async chunk so the federation shared scope initializes first.
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
    // (TS2835) even when the file on disk is `.ts`. This maps the specifier back to the real
    // source so both tools agree; without it webpack looks for a literal `.js` sibling and fails
    // to resolve.
    extensionAlias: {
      '.js': ['.ts', '.js']
    }
  },

  module: {
    rules: [
      // No babel-loader any more. This package used to compile JSX with @babel/preset-react,
      // which also made it one of the three packages that break when @babel/core 8 is hoisted
      // (the preset asserts a peer of ^7.0.0-0 and throws). There is no JSX left to transform.
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: require.resolve('ts-loader'),
        options: {
          // Types are checked by `yarn typecheck` and in CI rather than in the bundler, so a dev
          // rebuild is a transpile.
          transpileOnly: true,
          compilerOptions: {
            noEmit: false
          }
        }
      },
      // This MFE's own namespaced stylesheet only. The document-wide theme (tokens.css +
      // global.css) is the shell's job.
      {
        test: /\.css$/i,
        use: [require.resolve('style-loader'), require.resolve('css-loader')]
      }
    ]
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'nav',
      library: { type: 'var', name: 'nav' },
      filename: 'remoteEntry.js',
      exposes: {
        /*
         * Two applications from one package. They deploy together — the chrome is one team's
         * concern — and are separate single-spa applications only because the shell mounts them in
         * two different places: the bar at the top of the page and the footer at the bottom.
         *
         * Toasts used to be a third one here, and moved out to the `notifications` remote on :3007.
         * The tell was in this very list: the bar and footer are suppressed on `/login`, while a
         * failed-login toast must still appear — a fragment with a different route contract, a
         * different set of consumers and a different reason to change is a different MFE.
         *
         * Capital first letter matches the files on disk. A lowercase path resolves on Windows and
         * fails on a case-sensitive filesystem, i.e. in CI.
         */
        './Header': './src/Header',
        './Footer': './src/Footer'
      },
      /*
       * Only what the bar renders with. `lit` and the design system are here because the sign-out
       * control is an `<mm-button>`, and both must be singletons for the usual reason: custom
       * element registration is global, so a second copy of the design system would find every
       * `mm-*` tag already defined and its component classes would simply never be used. Whichever
       * remote loaded first would silently own the components — and any fix shipped by the other
       * would appear to have no effect.
       *
       * What is *not* here is more interesting, and the list got shorter for a reason worth stating.
       *
       * `@micro-medic/shared-store` was in this comment as the interesting case — bundled from source
       * yet still a runtime singleton, because `auth-store.ts` and `event-bus.ts` park their instances
       * on `globalThis`. It is now absent from the *package* entirely: the bar takes the session as
       * attributes from the shell and dispatches a bubbling `nav:sign-out` instead of importing a
       * store to mutate. The `globalThis` dedupe is still how the other consumers stay in agreement;
       * this remote simply is not one of them any more. `shared-types` remains, as source through the
       * tsconfig `paths` map, and is types-only — nothing of it survives into the bundle but the
       * `Role` enum's values.
       *
       * `single-spa` is absent too: this package imports it nowhere — the design system's
       * `createCustomElementLifecycles` implements the lifecycle contract directly and
       * `nav-app-bar.ts` navigates with `pushState`, so there is no dependency to add in the first
       * place, singleton or not.
       */
      shared: {
        lit: { singleton: true, requiredVersion: '^3.3.3' },
        '@micro-medic/design-system': { singleton: true, requiredVersion: '^1.0.0' }
      }
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
});
