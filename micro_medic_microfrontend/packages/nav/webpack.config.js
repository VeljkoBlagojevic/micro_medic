const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  // The standalone harness, not one of the exposed modules: `entry` builds the page served on
  // :3003 for development, while `exposes` below is what the shell consumes. The dynamic import
  // inside it forces an async chunk so the federation shared scope initializes first.
  entry: './src/bootstrap-standalone',
  cache: false,

  mode: 'development',
  devtool: 'source-map',

  optimization: {
    minimize: false
  },

  output: {
    publicPath: 'http://localhost:3003/'
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
       * What is *not* here is more interesting. `@micro-medic/shared-store` and `shared-types` are
       * consumed as TypeScript source through the tsconfig `paths` map, so `shared-store` is
       * bundled into this remote — and the store is still a singleton at runtime anyway:
       * `auth-store.ts` and `event-bus.ts` park their instances on
       * `globalThis.__MICRO_MEDIC_AUTH_STORE__` / `__MICRO_MEDIC_EVENT_BUS__`, so a second
       * evaluation of the module finds the first instance and hands it back. Federation's
       * `singleton: true` is an optimisation for those two, not the mechanism — which is why this
       * remote observes exactly the same auth state and event bus as `calendar` and `auth` even
       * though it does not negotiate them through the shared scope.
       *
       * `single-spa` is absent too, and deliberately: the shell is on v5 while `calendar` and
       * `auth` are on v6, so it is not federated as a singleton (see `home/webpack.config.js`) and
       * every remote importing it bundles a second copy that patches `window.history`. This
       * package imports it nowhere — `src/lifecycles.ts` implements the lifecycle contract
       * directly and `nav-app-bar.ts` navigates with `pushState` — so it is the one MFE that does
       * not take part in that.
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
};
