const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  entry: './src/bootstrap-standalone',
  cache: false,

  mode: 'development',
  devtool: 'source-map',

  optimization: {
    minimize: false
  },

  output: {
    // `auto`, not a literal origin: derived from `document.currentScript.src` when
    // remoteEntry.js executes, so the container works on whatever host serves it.
    publicPath: 'auto'
  },

  devServer: {
    port: 3009,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    // `moduleResolution: nodenext` makes tsc demand a `.js` extension on relative ESM
    // imports (TS2835) even when the file is `.ts`/`.tsx`. This maps the specifier back to
    // the real source so both tools agree; otherwise webpack looks for a literal `.js`
    // sibling and fails to resolve. See `src/bootstrap-standalone.ts`.
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js']
    }
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: require.resolve('ts-loader'),
        options: {
          transpileOnly: true,
          compilerOptions: {
            noEmit: false
          }
        }
      },
      {
        test: /\.css$/i,
        use: [require.resolve('style-loader'), require.resolve('css-loader')],
      }
    ]
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'calendar',
      library: { type: 'var', name: 'calendar' },
      filename: 'remoteEntry.js',
      exposes: {
        // Capital C — the file is `src/Calendar.tsx`. A lowercase path resolves on Windows
        // but fails on a case-sensitive filesystem (i.e. CI and Linux containers).
        './Calendar': './src/Calendar',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.7' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.7' },
        'single-spa-react': { singleton: true },
        'single-spa': { singleton: true },
        lit: { singleton: true, requiredVersion: '^3.3.3' },
        axios: { singleton: true },
        "@micro-medic/shared-store": { singleton: true, requiredVersion: '^1.0.0' },
        "@micro-medic/shared-types": { singleton: true, requiredVersion: '^1.0.0' },
        "@micro-medic/api-client": { singleton: true, requiredVersion: '^1.0.0' },
        "@micro-medic/design-system": { singleton: true, requiredVersion: '^1.0.0' },
        // Must be a singleton too: it holds the @lit/react wrappers, and two copies would
        // mean two registrations racing for the same custom element tags.
        "@micro-medic/design-system-react": { singleton: true, requiredVersion: '^1.0.0' },
      }
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    })
  ]
};
