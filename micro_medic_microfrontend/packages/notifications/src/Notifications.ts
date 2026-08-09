// Registering the element is an import side effect, as it is everywhere in this repo — so importing
// this module is what makes `<notification-center>` exist.
import './notification-center.js';
// The single-spa adapter for a custom element, shared with `nav` rather than copied. See its header
// for why it does not import `single-spa`.
import { createCustomElementLifecycles } from '@micro-medic/design-system';

/*
 * No stylesheet import, and that is not an omission: everything visible here is inside
 * `mm-toast-region`'s shadow root, so a document-level rule could not reach it even if this package
 * shipped one. Positioning, stacking and the four surface treatments all come from the component and
 * the `--mm-*` tokens the shell already loads. A micro-frontend with genuinely nothing to style is
 * the strongest evidence the design-system split landed in the right place.
 */

const lifecycles = createCustomElementLifecycles('notification-center');

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
