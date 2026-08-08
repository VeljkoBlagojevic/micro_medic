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
    MmSpinner as MmSpinnerElement,
    MmTable as MmTableElement,
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

export const MmSpinner = createComponent('mm-spinner', MmSpinnerElement);

export const MmTable = createComponent('mm-table', MmTableElement, {
    onRowClick: 'mm-row-click',
} as const);
