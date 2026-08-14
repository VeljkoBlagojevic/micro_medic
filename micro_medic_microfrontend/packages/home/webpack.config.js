const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  entry: './src/index',
  cache: false,

  mode: 'development',
  devtool: 'source-map',
  optimization: { minimize: false },
  // `auto` rather than a literal origin: webpack derives the public path from
  // `document.currentScript.src` when the entry executes, so a bundle reports whichever origin
  // actually served it. A hardcoded `http://localhost:3001/` is correct on exactly one machine and
  // silently wrong everywhere else - every asset request and every lazily loaded chunk goes to
  // localhost, so the app half-loads from a colleague's laptop or any deployed host.
  output: { publicPath: 'auto' },
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
      }
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
        // The shell imports the store to gate routes on authentication, and as plain JS with no
        // ts-loader this remote is the only way it can: every other package resolves
        // `@micro-medic/shared-store` from source through the `paths` map instead. Keys are
        // import specifiers; values are the globals each remote's `library.name` defines.
        shared_store: 'shared_store'
      },
      /*
       * `single-spa` is now shared as a singleton. It used to be declared `shared: {}` here
       * while the shell sat on single-spa 5 and `calendar`/`auth` were already on 6 — sharing it
       * then would have published the shell's v5 into the scope and silently downgraded both
       * React remotes at runtime. That was always meant to be temporary: `home`'s own usage
       * (`registerApplication`, `start`, `navigateToUrl`) is stable across the v5/v6 boundary, so
       * once the shell moved to 6.0.3 there was no reason left to keep three separate copies of
       * a library that patches `window.history` in one document.
       *
       * Only three packages depend on `single-spa` at all — this shell, `auth` and `calendar`.
       * `nav` and `notifications` take their lifecycles from the design system's
       * `createCustomElementLifecycles`, and `examination` and `icd10` hand-write
       * `bootstrap`/`mount`/`unmount`, so none of the four is exposed to this singleton either
       * way.
       */
      shared: {
        'single-spa': { singleton: true }
      }
    }),
    new HtmlWebpackPlugin({template: './public/index.html'}),
  ]
};
