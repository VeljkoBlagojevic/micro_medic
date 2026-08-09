const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  entry: './src/index',
  cache: false,

  mode: 'development',
  devtool: 'source-map',

  optimization: {
    minimize: false
  },

  output: {
    publicPath: 'http://localhost:3002/'
  },

  resolve: {
    extensions: ['.jsx', '.js', '.json']
  },

  // No babel-loader: this micro-frontend is plain HTML-in-a-template-string with no JSX, so
  // there is nothing for @babel/preset-react to transform. Dropping the rule also drops a
  // build failure mode — preset-react 7 throws when babel-loader resolves @babel/core 8.
  module: {
    rules: [
      // Only this MFE's own namespaced stylesheet. It must never ship a reset or the
      // `--mm-*` tokens: those are document-wide and the shell owns them.
      {
        test: /\.css$/i,
        use: [require.resolve('style-loader'), require.resolve('css-loader')]
      }
    ]
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'icd10',
      library: { type: 'var', name: 'icd10' },
      filename: 'remoteEntry.js',
      remotes: {
        // The key is the import specifier, the value the global the remote's
        // `library.name` defines. Was `store: 'store'`, which matched no remote — the
        // shared store publishes itself as `shared_store`. The `home: 'home'` entry was
        // unused and is gone: a remote importing the shell would be a dependency cycle.
        shared_store: 'shared_store'
      },
      exposes: {
        './ICD10': './src/index'
      },
      shared: {
        'single-spa-html': { singleton: true },
        // Must match the shared store's own declaration, or federation hands this MFE a
        // second axios instance that never received `configureApiClient`.
        axios: { singleton: true }
      }
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      chunks: ['main']
    })
  ]
};
