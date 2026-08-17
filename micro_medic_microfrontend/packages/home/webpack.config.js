const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

// `--mode production` (what `yarn build` passes) overrides a config's `mode`, but *not* an explicit
// `optimization.minimize: false` — not being a mode default, that block survived every production
// build, so every bundle had been shipping unminified. Both settings derive from the one flag now.
const isProd = (argv) => argv.mode === 'production';

/*
 * Where each remote's container is fetched from, in the `name@url` form so webpack injects the
 * script itself at first import rather than requiring the global to pre-exist. That is what let the
 * seven blocking `<script>` tags leave `public/index.html`: a remote is now downloaded when a route
 * needs it, and one that is down fails a single `import()` — which `src/index.ts` catches — instead
 * of failing before the shell has run at all.
 *
 * The origins are still hardcoded, and moving them here does not fix that; it only puts the port
 * map next to the `remotes` keys it belongs to. Resolving them at runtime needs a discovery service
 * (Rappl ch. 15), which this repo names as a limitation rather than builds. What *is* derived is
 * everything after the container: each remote sets `publicPath: 'auto'`, so its chunks load from
 * whichever origin served its `remoteEntry.js`.
 */
const REMOTES = {
  nav: 'nav@http://localhost:3003/remoteEntry.js',
  notifications: 'notifications@http://localhost:3007/remoteEntry.js',
  icd10: 'icd10@http://localhost:3002/remoteEntry.js',
  examination: 'examination@http://localhost:3004/remoteEntry.js',
  calendar: 'calendar@http://localhost:3009/remoteEntry.js',
  auth: 'auth@http://localhost:3006/remoteEntry.js'
};

module.exports = (_env, argv) => ({
  entry: './src/index.ts',
  cache: false,

  mode: isProd(argv) ? 'production' : 'development',
  devtool: isProd(argv) ? false : 'source-map',
  // `auto` rather than a literal origin: webpack derives the public path from
  // `document.currentScript.src` when the entry executes, so a bundle reports whichever origin
  // actually served it. A hardcoded `http://localhost:3001/` is correct on exactly one machine and
  // silently wrong everywhere else - every asset request and every lazily loaded chunk goes to
  // localhost, so the app half-loads from a colleague's laptop or any deployed host.
  output: {
    publicPath: 'auto',
    // Hashed chunks in production. The shell's own entry keeps a stable name because
    // HtmlWebpackPlugin rewrites the reference for it either way. Production only —
    // `[contenthash]` and HMR do not mix.
    chunkFilename: isProd(argv) ? '[name].[contenthash].js' : '[name].js',
    clean: isProd(argv)
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    // `moduleResolution: nodenext` makes tsc demand a `.js` extension on relative imports even
    // when the file on disk is `.ts`; this maps the specifier back to the real source.
    extensionAlias: { '.js': ['.ts', '.js'] }
  },

  module: {
    rules: [
      // ts-loader, so the shell resolves `@micro-medic/shared-store` from source through the
      // `paths` map like every other consumer. Before this it was plain JS and the store could
      // only reach it as a federated remote on :3005 — one extra port and one extra container
      // for a types-and-singletons library that ships no UI.
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: require.resolve('ts-loader'),
        options: {
          // Types are checked by `yarn typecheck` and in CI rather than in the bundler.
          transpileOnly: true,
          compilerOptions: { noEmit: false }
        }
      },
      // The shell is the only package that loads the design system's document-wide theme
      // (tokens.css + global.css), so it is the only one that needs CSS loaders.
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
      // Keys are import specifiers; values are `name@url` — see `REMOTES` above. Every entry here
      // renders UI. `shared_store` used to be one too, which meant a library with no UI needed a
      // port, a container and a `<script>` tag; the shell now imports it from source.
      //
      // There is deliberately no `exposes`: the shell is a pure host. It still emits a
      // `remoteEntry.js` — the plugin always builds a container — and nothing consumes it, which is
      // why `public/index.html` no longer fetches the shell's own container on :3001.
      remotes: REMOTES,

      remoteType: 'script',

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
       *
       * `@micro-medic/shared-store` is deliberately *not* here. It is bundled from source, exactly
       * as `nav` and `notifications` bundle it, and is a singleton at runtime regardless:
       * `auth-store.ts` and `event-bus.ts` park their instances on `globalThis`, so a second
       * evaluation finds the first and hands it back. That dedupe is the mechanism; federation's
       * `singleton: true` would only be an optimisation.
       */
      shared: {
        'single-spa': { singleton: true, eager: true }
      }
    }),
    new HtmlWebpackPlugin({template: './public/index.html'}),
  ]
});
