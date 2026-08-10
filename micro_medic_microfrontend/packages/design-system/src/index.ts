/**
 * Importing this package registers every `mm-*` custom element as a side effect. Keep the
 * `./components` import first so the elements exist before anything else runs.
 */
export * from './components';

export { defineElement } from './define';
export { baseStyles, focusRing, visuallyHidden } from './styles/shared.styles';

export { mountDesignSystemParcel } from './parcel';
export type { DesignSystemParcelProps } from './parcel';

/*
 * The two ways a custom element takes part in the composition: as a single-spa *application*
 * (`createCustomElementLifecycles`, used by `nav` and `notifications`) or as a *parcel* mounted by
 * another MFE (`mountDesignSystemParcel`, the escape hatch for an MFE with no binding package).
 */
export { createCustomElementLifecycles } from './lifecycles';
export type { CustomElementLifecycles, CustomElementMountProps } from './lifecycles';
