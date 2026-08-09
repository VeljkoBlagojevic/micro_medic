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
    publicPath: 'http://localhost:3004/'
  },

  resolve: {
    extensions: ['.svelte', '.js', '.json'],
    // svelte-loader warns without this: Svelte packages publish a `svelte` export condition
    // pointing at uncompiled component sources, and webpack must prefer it over `browser`.
    conditionNames: ['svelte', 'browser', 'import', 'module', 'require', 'node']
  },

  module: {
    rules: [
      {
        test: /\.(svelte)$/,
        exclude: /node_modules/,
        use: {
          loader: 'svelte-loader',
          options: {
            externalDependencies: true,
          },
        },
      }
    ]
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'examination',
      library: { type: 'var', name: 'examination' },
      filename: 'remoteEntry.js',
      remotes: {
        // Was `store: 'store'`, which matched no remote — the shared store publishes itself
        // as `shared_store`. The `home: 'home'` entry was unused; a remote importing the
        // shell would invert the dependency direction.
        shared_store: 'shared_store'
      },
      exposes: {
        './Examination': './src/index'
      },
      shared: {
        // Singleton, to match the shared store's own declaration — two axios copies would
        // mean one that never received `configureApiClient`.
        axios: { singleton: true }
      }
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
  ]
};
