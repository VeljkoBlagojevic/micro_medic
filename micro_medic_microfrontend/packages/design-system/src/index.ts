/**
 * Importing this package registers every `mm-*` custom element as a side effect. Keep the
 * `./components` import first so the elements exist before anything else runs.
 */
export * from './components';

export { defineElement } from './define';
export { baseStyles, focusRing, visuallyHidden } from './styles/shared.styles';

/*
 * How a custom element takes part in the composition: as a single-spa *application* whose whole UI is
 * one element. `nav` and `notifications` are both that shape.
 *
 * A `mountDesignSystemParcel` export was deleted from here. It was the offered escape hatch for an MFE
 * with no binding package, and nothing imported it — the repo answered that case differently, since
 * what `icd10` needs is `isCustomElement` in its vue-loader options, not a parcel.
 */
export { createCustomElementLifecycles } from './lifecycles';
export type { AttributeMap, AttributeProjector, AttributeSource, CustomElementLifecycles, CustomElementMountProps } from './lifecycles';
