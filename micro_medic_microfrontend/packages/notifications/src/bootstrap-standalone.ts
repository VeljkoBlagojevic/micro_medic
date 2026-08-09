// Dynamic import, so the harness lands in an async chunk and Module Federation's shared scope is
// initialized before any shared module (`lit`, `@micro-medic/design-system`) is evaluated.
//
// The `.js` extension is what `moduleResolution: nodenext` requires of a relative ESM specifier
// (TS2835) even though the file on disk is `standalone.ts`; webpack maps it back via
// `resolve.extensionAlias`.
//
// The rejection handler is not ceremony: this is the entry point, so a chunk that fails to load
// would otherwise reject into nothing and leave a blank page with a silent console.
import('./standalone.js').catch((error: unknown) => {
    console.error('[notifications] Failed to load the standalone entry point:', error);
});
