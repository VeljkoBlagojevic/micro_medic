const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

// `--mode production` (what `yarn build` passes) overrides a config's `mode`, but *not* an explicit
// `optimization.minimize: false` — not being a mode default, that block survived every production
// build, so every remote had been shipping unminified. Both settings derive from the one flag now.
const isProd = (argv) => argv.mode === 'production';

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
});
