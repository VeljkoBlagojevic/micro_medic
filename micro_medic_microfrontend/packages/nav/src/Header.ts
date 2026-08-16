// Registering the element is an import side effect, exactly as it is in the design system — so
// importing this module is what makes `<nav-app-bar>` exist.
import './nav-app-bar.js';
// The single-spa adapter for a custom element, shared with `notifications` rather than copied into
// both. See its header for why it does not import `single-spa`.
import { createCustomElementLifecycles } from '@micro-medic/design-system';
import { projectSession } from './session-attributes.js';

// This MFE's own namespaced stylesheet. The document-wide theme (`tokens.css` + `global.css`) is
// the shell's, and must not be imported here: two remotes each shipping a reset is the classic
// micro-frontend collision, and whichever loads second silently wins.
import './styles.css';

/*
 * The shell passes `{ session: authContext }` as `customProps`; `projectSession` flattens it to
 * `authenticated` / `user-name` / `user-role` and the adapter sets them on the element.
 *
 * This file is the only place in the package that knows a host might pass a session at all, which is
 * what keeps the element itself a function of its own attributes. Translating parent context into the
 * child's native input mechanism is exactly what `single-spa-react` and `single-spa-angular` do for
 * their frameworks — for a custom element that mechanism is attributes, so the translation is one
 * function rather than a package.
 */
const lifecycles = createCustomElementLifecycles('nav-app-bar', projectSession);

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
