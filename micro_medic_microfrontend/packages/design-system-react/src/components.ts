/**
 * React bindings for every `mm-*` element.
 *
 * Importing this module also registers the custom elements, because
 * `@micro-medic/design-system` defines them as an import side effect. That is intentional:
 * a consumer should never have to remember a separate `import '@micro-medic/design-system'`
 * alongside the React component.
 *
 * Event props follow React convention (`onClose`, not `onMm-close`); the DOM event name each
 * one maps to is on the right of the `events` map so the mapping stays greppable from both
 * sides.
 */
import {
    MmButton as MmButtonElement,
    MmCard as MmCardElement,
    MmEmptyState as MmEmptyStateElement,
    MmErrorState as MmErrorStateElement,
    MmInput as MmInputElement,
    MmModal as MmModalElement,
    MmSelect as MmSelectElement,
    MmSpinner as MmSpinnerElement,
    MmTable as MmTableElement,
    MmToast as MmToastElement,
    MmToastRegion as MmToastRegionElement,
} from '@micro-medic/design-system';
import { createComponent } from './create-component';

export const MmButton = createComponent('mm-button', MmButtonElement);

export const MmCard = createComponent('mm-card', MmCardElement, {
    onCardClick: 'mm-card-click',
} as const);

export const MmEmptyState = createComponent('mm-empty-state', MmEmptyStateElement);

export const MmErrorState = createComponent('mm-error-state', MmErrorStateElement, {
    onRetry: 'mm-retry',
} as const);

export const MmInput = createComponent('mm-input', MmInputElement, {
    onInput: 'mm-input',
    onChange: 'mm-change',
    onBlur: 'mm-blur',
} as const);

export const MmModal = createComponent('mm-modal', MmModalElement, {
    onClose: 'mm-close',
} as const);

// Same event trio as `mm-input`, so the same form bridge works against either element.
export const MmSelect = createComponent('mm-select', MmSelectElement, {
    onInput: 'mm-input',
    onChange: 'mm-change',
    onBlur: 'mm-blur',
} as const);

export const MmSpinner = createComponent('mm-spinner', MmSpinnerElement);

export const MmTable = createComponent('mm-table', MmTableElement, {
    onRowClick: 'mm-row-click',
} as const);

export const MmToast = createComponent('mm-toast', MmToastElement, {
    onDismiss: 'mm-dismiss',
} as const);

/**
 * The region is normally driven imperatively — `ref.current.show(...)` — because a notification is
 * an event rather than state. The binding still earns its place: it is what gives a React caller a
 * `ref` typed as `MmToastRegion` (so `show`/`dismiss`/`clear` are checked) and a typed
 * `onToastDismiss`, neither of which a raw JSX tag provides.
 */
export const MmToastRegion = createComponent('mm-toast-region', MmToastRegionElement, {
    onToastDismiss: 'mm-toast-dismiss',
} as const);
