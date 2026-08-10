/**
 * Webpack's entry point for the standalone dev harness.
 *
 * One dynamic import and nothing else, which is load-bearing rather than stylistic: it forces
 * everything real into an async chunk, so Module Federation's shared scope is initialised before any
 * shared module is evaluated. A static import here would pull `vue`, `lit` and the four
 * `@micro-medic/*` singletons into the initial chunk, where the container has not yet negotiated
 * versions — and the failure mode is a second copy of one of them, which for the design system means
 * whichever copy loaded first silently owns every `mm-*` tag.
 *
 * Same shape as `calendar/src/bootstrap-standalone.ts`, `auth`'s and `examination`'s.
 */
void import('./standalone.js');
