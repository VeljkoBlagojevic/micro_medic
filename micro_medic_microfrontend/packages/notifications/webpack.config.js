const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  // The standalone harness, not the exposed module: `entry` builds the page served on :3007 for
  // development, while `exposes` below is what the shell consumes. The dynamic import inside it
  // forces an async chunk so the federation shared scope initializes first.
  entry: './src/bootstrap-standalone',
  cache: false,

  mode: 'development',
  devtool: 'source-map',

  optimization: {
    minimize: false
  },

  output: {
    publicPath: 'http://localhost:3007/'
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
      /*
       * Only the standalone harness imports CSS (the design system's `global.css`, which the shell
       * loads in the real application). This MFE ships no stylesheet of its own: everything it
       * renders lives inside `mm-toast-region`'s shadow root, where a document-level rule cannot
       * reach.
       */
      {
        test: /\.css$/i,
        use: [require.resolve('style-loader'), require.resolve('css-loader')]
      }
    ]
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'notifications',
      library: { type: 'var', name: 'notifications' },
      filename: 'remoteEntry.js',
      exposes: {
        // Capital N matches the file on disk. A lowercase path resolves on Windows and fails on a
        // case-sensitive filesystem, i.e. in CI.
        './Notifications': './src/Notifications'
      },
      /*
       * `lit` and the design system must be singletons: custom element registration is global to the
       * document, so a second copy of the design system would find `mm-toast-region` already defined
       * and its component class would simply never be used. Whichever remote loaded first would
       * silently own the components — and a fix shipped by the other would appear to have no effect.
       *
       * `@micro-medic/shared-store` and `shared-types` are absent on purpose. They are consumed as
       * TypeScript source through the tsconfig `paths` map, so `shared-store` is bundled into this
       * remote — and the event bus is still the same object at runtime regardless: `event-bus.ts`
       * parks its instance on `globalThis.__MICRO_MEDIC_EVENT_BUS__`, so a second evaluation of the
       * module finds the first bus and hands it back. That is what makes this micro-frontend able to
       * hear `NOTIFICATION_SHOW` from `calendar`, `auth` and `examination` without sharing a module
       * graph with any of them.
       *
       * `single-spa` is absent too: the shell is on v5 while `calendar` and `auth` are on v6, so it is
       * deliberately not federated as a singleton (see `home/webpack.config.js`). This package
       * imports it nowhere — the lifecycle contract is implemented directly in the design system's
       * `createCustomElementLifecycles`.
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
