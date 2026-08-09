import { Directive, Input } from '@angular/core';
import type { MmSpinner, SpinnerSize } from '@micro-medic/design-system';
import { booleanInput } from './coercion';
import { MmElementDirective } from './custom-element.base';

/** Typed bindings for `<mm-spinner>`. Presentational only — it emits no events. */
@Directive({
    selector: 'mm-spinner',
    standalone: true,
})
export class MmSpinnerDirective extends MmElementDirective<MmSpinner> {
    @Input() size?: SpinnerSize;

    /**
     * Doubles as the accessible name. Left unset it keeps the element's own default
     * ("Loading..."), which is why the base forwarder skips `undefined` instead of writing it.
     */
    @Input() label?: string;

    @Input({ transform: booleanInput }) centered?: boolean;
    /** Keeps `label` as the accessible name while hiding it visually. */
    @Input({ transform: booleanInput }) hideLabel?: boolean;
}
