/**
 * Importing this package registers every `mm-*` custom element as a side effect. Keep the
 * `./components` import first so the elements exist before anything else runs.
 */
export * from './components';

export { defineElement } from './define';
export { baseStyles, focusRing, visuallyHidden } from './styles/shared.styles';

export { mountDesignSystemParcel } from './parcel';
export type { DesignSystemParcelProps } from './parcel';
