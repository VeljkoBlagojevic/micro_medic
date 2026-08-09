import { Directive, EventEmitter, Input, Output } from '@angular/core';
import type { MmModal } from '@micro-medic/design-system';
import { booleanInput } from './coercion';
import { MmElementDirective } from './custom-element.base';

export type ModalSize = 'sm' | 'md' | 'lg';

/**
 * Typed bindings for `<mm-modal>`.
 *
 * `open` is one-way in, `close` is the event out — the element also flips its own `open` when
 * dismissed via Escape or the backdrop, so the host must handle `(close)` and update its state.
 * Nothing here writes back to the binding, so `[open]` stays the single source of truth.
 */
@Directive({
    selector: 'mm-modal',
    standalone: true,
    host: {
        '(mm-close)': 'forward(close, $event)',
    },
})
export class MmModalDirective extends MmElementDirective<MmModal> {
    @Input({ transform: booleanInput }) open?: boolean;
    @Input() heading?: string;
    @Input() size?: ModalSize;

    /**
     * Defaults to `true` on the element, so leaving this unset keeps Escape/backdrop dismissal.
     * `undefined` is skipped by the base forwarder rather than written as `undefined`.
     */
    @Input({ transform: booleanInput }) dismissible?: boolean;

    @Output() readonly close = new EventEmitter<CustomEvent<void>>();
}
