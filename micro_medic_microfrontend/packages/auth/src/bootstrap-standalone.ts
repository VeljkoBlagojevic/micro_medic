// Dynamic import, so the standalone app lands in an async chunk and Module Federation's shared
// scope is initialized before any shared module is evaluated.
//
// The `.js` extension is what `moduleResolution: nodenext` requires of a relative ESM specifier
// (TS2835 without it) even though the file on disk is `standalone.tsx`. Webpack maps it back via
// `resolve.extensionAlias` in the config — without that entry it looks for a literal
// `standalone.js` and the build fails.
//
// The rejection handler is not ceremony: this is the entry point, so a chunk that fails to load
// (a stale `dist`, the dev server not up, a network blip) would otherwise reject into nothing and
// leave a blank page with a silent console.
import('./standalone.js').catch((error: unknown) => {
    console.error('[auth] Failed to load the standalone entry point:', error);
});
