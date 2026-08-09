import { Directive, EventEmitter, Input, Output } from '@angular/core';
import type { MmToast, ToastType } from '@micro-medic/design-system';
import { booleanInput } from './coercion';
import { MmElementDirective } from './custom-element.base';

/**
 * Typed bindings for `<mm-toast>` — a single notification, rendered inline.
 *
 * For the usual case (messages arriving from anywhere in the application) use
 * `MmToastRegionDirective` instead, or leave it to the `notifications` micro-frontend entirely.
 * This directive is for a component that wants one toast in its own layout.
 */
@Directive({
    selector: 'mm-toast',
    standalone: true,
    host: {
        '(mm-dismiss)': 'forward(dismiss, $event)',
    },
})
export class MmToastDirective extends MmElementDirective<MmToast> {
    @Input() type?: ToastType;
    @Input() message?: string;

    /** Defaults to `true` on the element; `undefined` is skipped by the base forwarder. */
    @Input({ transform: booleanInput }) dismissible?: boolean;

    /**
     * The element does not remove itself — it announces the intent and the host decides. A toast
     * that hid itself would be unusable inside a region, which needs to cancel its timer and keep
     * its own list in step.
     */
    @Output() readonly dismiss = new EventEmitter<CustomEvent<void>>();
}
