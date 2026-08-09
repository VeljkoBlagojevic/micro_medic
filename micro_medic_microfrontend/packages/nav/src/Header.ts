// Registering the element is an import side effect, exactly as it is in the design system — so
// importing this module is what makes `<nav-app-bar>` exist.
import './nav-app-bar.js';
// The single-spa adapter for a custom element, shared with `notifications` rather than copied into
// both. See its header for why it does not import `single-spa`.
import { createCustomElementLifecycles } from '@micro-medic/design-system';

// This MFE's own namespaced stylesheet. The document-wide theme (`tokens.css` + `global.css`) is
// the shell's, and must not be imported here: two remotes each shipping a reset is the classic
// micro-frontend collision, and whichever loads second silently wins.
import './styles.css';

const lifecycles = createCustomElementLifecycles('nav-app-bar');

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
