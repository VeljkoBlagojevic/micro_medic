import './nav-footer.js';
import { createCustomElementLifecycles } from '@micro-medic/design-system';

import './styles.css';

const lifecycles = createCustomElementLifecycles('nav-footer');

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
