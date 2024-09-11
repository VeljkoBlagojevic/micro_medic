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
    publicPath: 'http://localhost:3009/'
  },

  resolve: {
    extensions: ['.jsx', '.js', '.json', '.ts', '.tsx']
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: require.resolve('babel-loader'),
        options: {
          presets: [require.resolve('@babel/preset-react')]
        }
      }
    ]
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'calendar',
      library: { type: 'var', name: 'calendar' },
      filename: 'remoteEntry.js',
      remotes: {
        store: 'store',
      },
      exposes: {
        './Calendar': './src/calendar',
      },
      shared: ['react', 'react-dom', 'single-spa-react']
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      chunks: ['main']
    })
  ]
};
