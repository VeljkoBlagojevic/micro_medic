/**
 * Angular bindings for the `mm-*` design system.
 *
 * Importing this module registers every custom element as a side effect (the re-export of
 * `@micro-medic/design-system` below pulls in its component definitions). Nothing in this
 * package renders anything itself — each export is a directive that gives an existing custom
 * element a type-checked Angular API.
 *
 * The theme (`tokens.css` / `global.css`) is *not* imported here. It is loaded once by the
 * shell, because a document-wide stylesheet shipped by a micro-frontend collides with every
 * other MFE that does the same.
 */

// Side-effect import: defines the custom elements the directives bind to. Without this, the
// tags render as inert unknown elements and the directives set properties on nothing.
import '@micro-medic/design-system';

import { MmButtonDirective } from './lib/mm-button.directive';
import { MmCardDirective } from './lib/mm-card.directive';
import { MmEmptyStateDirective } from './lib/mm-empty-state.directive';
import { MmErrorStateDirective } from './lib/mm-error-state.directive';
import { MmInputDirective } from './lib/mm-input.directive';
import { MmModalDirective } from './lib/mm-modal.directive';
import { MmSpinnerDirective } from './lib/mm-spinner.directive';
import { MmTableDirective } from './lib/mm-table.directive';

export { MmElementDirective } from './lib/custom-element.base';
export { booleanInput, numberInput } from './lib/coercion';

export { MmButtonDirective } from './lib/mm-button.directive';
export { MmCardDirective } from './lib/mm-card.directive';
export { MmEmptyStateDirective } from './lib/mm-empty-state.directive';
export { MmErrorStateDirective } from './lib/mm-error-state.directive';
export { MmInputDirective, type MmInputEvent } from './lib/mm-input.directive';
export { MmModalDirective, type ModalSize } from './lib/mm-modal.directive';
export { MmSpinnerDirective } from './lib/mm-spinner.directive';
export { MmTableDirective, type MmRowClickEvent } from './lib/mm-table.directive';

/**
 * Every directive in the library, for a one-line `imports:` in a standalone component:
 *
 * ```ts
 * @Component({ standalone: true, imports: [MM_DESIGN_SYSTEM], template: `...` })
 * ```
 *
 * Convenient, but it opts the component into all of them. A component that only needs two
 * should import those two — the unused ones are then tree-shaken.
 */
export const MM_DESIGN_SYSTEM = [
    MmButtonDirective,
    MmCardDirective,
    MmEmptyStateDirective,
    MmErrorStateDirective,
    MmInputDirective,
    MmModalDirective,
    MmSpinnerDirective,
    MmTableDirective,
] as const;

/** Re-exported so consumers get the element and prop types without a second dependency. */
export type {
    ButtonSize,
    ButtonType,
    ButtonVariant,
    MmButton,
    MmCard,
    MmEmptyState,
    MmErrorState,
    MmInput,
    MmModal,
    MmSpinner,
    MmTable,
    MmTableColumn,
    MmTableRow,
    SpinnerSize,
} from '@micro-medic/design-system';
