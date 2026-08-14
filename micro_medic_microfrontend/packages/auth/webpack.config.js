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

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    // `moduleResolution: nodenext` makes tsc demand a `.js` extension on relative ESM
    // imports (TS2835) even when the file is `.ts`/`.tsx`. This maps the specifier back to
    // the real source so both tools agree.
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
      // This MFE's own namespaced stylesheet only. The document-wide theme (tokens.css +
      // global.css) is the shell's job — two remotes shipping a reset is the classic
      // micro-frontend CSS collision.
      {
        test: /\.css$/i,
        use: [require.resolve('style-loader'), require.resolve('css-loader')]
      }
    ]
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'auth',
      library: { type: 'var', name: 'auth' },
      filename: 'remoteEntry.js',
      exposes: {
        './Auth': './src/Auth'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.7' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.7' },
        'single-spa-react': { singleton: true },
        'single-spa': { singleton: true },
        lit: { singleton: true, requiredVersion: '^3.3.3' },
        axios: { singleton: true },
        // These four must be singletons: the auth store holds the token every other MFE
        // reads, and a second copy of the design system would race for the same custom
        // element tag registrations.
        '@micro-medic/shared-store': { singleton: true, requiredVersion: '^1.0.0' },
        '@micro-medic/shared-types': { singleton: true, requiredVersion: '^1.0.0' },
        '@micro-medic/api-client': { singleton: true, requiredVersion: '^1.0.0' },
        '@micro-medic/design-system': { singleton: true, requiredVersion: '^1.0.0' },
        '@micro-medic/design-system-react': { singleton: true, requiredVersion: '^1.0.0' }
      }
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
};
