// One binding per `mm-*` element, all eleven. `MmToast`/`MmToastRegion` have no consumer today —
// toasts belong to the `notifications` MFE, which is a custom element and needs no binding — but
// they are exported for the same reason the rest are: this package's contract is "every element,
// bound", and a binding reachable only through a deep import into `./components` is one a consumer
// would reasonably conclude does not exist.
export {
    MmButton,
    MmCard,
    MmEmptyState,
    MmErrorState,
    MmInput,
    MmModal,
    MmSelect,
    MmSpinner,
    MmTable,
    MmToast,
    MmToastRegion,
} from './components';

export { MmField } from './MmField';
export type { MmFieldProps } from './MmField';

export { MmSelectField } from './MmSelectField';
export type { MmSelectFieldProps } from './MmSelectField';

export { valueOf } from './types';
export type { MmInputEvent, MmRowClickEvent, MmValueDetail } from './types';

export { createComponent } from './create-component';

// Re-export the element types and design-token unions so a React consumer never needs a
// direct dependency on the Lit package just to type a `variant` prop.
export type {
    ButtonSize,
    ButtonVariant,
    ButtonType,
    MmSelectOption,
    MmTableColumn,
    MmTableRow,
    SpinnerSize,
} from '@micro-medic/design-system';
