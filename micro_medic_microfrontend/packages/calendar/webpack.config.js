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
    publicPath: 'http://localhost:3009/'
  },

  devServer: {
    port: 3009,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
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
        './Calendar': './src/calendar',
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
      }
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    })
  ]
};
