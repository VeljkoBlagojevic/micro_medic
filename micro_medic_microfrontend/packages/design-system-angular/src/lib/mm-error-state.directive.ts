import { Directive, EventEmitter, Input, Output } from '@angular/core';
import type { MmErrorState } from '@micro-medic/design-system';
import { booleanInput } from './coercion';
import { MmElementDirective } from './custom-element.base';

/**
 * Typed bindings for `<mm-error-state>`.
 *
 * The retry button only renders when `retryable` is set, so `(retry)` alone does nothing —
 * both are needed.
 */
@Directive({
    selector: 'mm-error-state',
    standalone: true,
    host: {
        '(mm-retry)': 'forward(retry, $event)',
    },
})
export class MmErrorStateDirective extends MmElementDirective<MmErrorState> {
    @Input() heading?: string;
    @Input() description?: string;
    /** Takes precedence over `description` when both are set. */
    @Input() message?: string;
    @Input() retryLabel?: string;

    @Input({ transform: booleanInput }) retryable?: boolean;

    @Output() readonly retry = new EventEmitter<CustomEvent<void>>();
}
