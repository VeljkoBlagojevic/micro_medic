const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  entry: './src/index',
  cache: false,

  mode: 'development',
  devtool: 'source-map',
  optimization: { minimize: false },
  output: { publicPath: 'http://localhost:3001/' },
  resolve: { extensions: ['.jsx', '.js', '.json'] },

  module: {
    rules: [
      // No babel-loader: the shell is five `registerApplication` calls and a CSS import, with
      // no JSX and no syntax webpack cannot parse natively. Transpiling it only coupled the
      // build to the @babel/core version that happened to be hoisted.
      //
      // The shell is the only package that loads the design system's document-wide theme
      // (tokens.css + global.css), so it is the only legacy package that needs CSS loaders.
      {
        test: /\.css$/i,
        use: [require.resolve('style-loader'), require.resolve('css-loader')]
      },
      { test: /\.md$/, loader: 'raw-loader' }
    ]
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'home',
      library: { type: 'var', name: 'home' },
      filename: 'remoteEntry.js',
      remotes: {
        nav: 'nav',
        notifications: 'notifications',
        icd10: 'icd10',
        examination: 'examination',
        calendar: 'calendar',
        auth: 'auth',
        // The shell imports the store directly (to gate routes on authentication), and
        // `icd10`/`examination` declare it as a remote of their own. Keys are import
        // specifiers; values are the globals each remote's `library.name` defines.
        shared_store: 'shared_store'
      },
      /*
       * The shell shares nothing into the federation scope, which is a compromise worth naming.
       *
       * It and every React remote import `single-spa`, so in principle that should be a
       * singleton here — two copies each patch `window.history`. It is not, because the shell is
       * still on single-spa 5 (with `nav`'s single-spa-react 4) while `calendar` and `auth` are
       * on 6: declaring it shared would hand every remote the shell's v5 at runtime, silently
       * downgrading them. The versions have to converge first.
       *
       * It works today because both copies patch `pushState` and each fires its own routing
       * event, so `navigateToUrl` from a remote still reaches the shell's router. Fragile, not
       * broken — see "State of the code" in CLAUDE.md.
       */
      shared: {}
    }),
    new HtmlWebpackPlugin({template: './public/index.html'}),
  ]
};
