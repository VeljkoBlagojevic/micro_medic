import singleSpaSvelte from 'single-spa-svelte';
import rootExaminationComponent from './app.svelte';

const examinationLifecycles = singleSpaSvelte({
  component: rootExaminationComponent
});

export const bootstrap = examinationLifecycles.bootstrap;
export const mount = examinationLifecycles.mount;
export const unmount = examinationLifecycles.unmount;
