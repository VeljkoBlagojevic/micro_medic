import { Directive, EventEmitter, Input, Output } from '@angular/core';
import type { MmCard } from '@micro-medic/design-system';
import { booleanInput } from './coercion';
import { MmElementDirective } from './custom-element.base';

/**
 * Typed bindings for `<mm-card>`.
 *
 * The `mm-card-click` event is surfaced as a `cardClick` output. Angular could listen to
 * `(mm-card-click)` directly, but an `@Output` keeps the template in Angular's own idiom and,
 * more importantly, makes the event part of the type-checked API — with `strictTemplates`, a
 * misspelled `(cardClik)` is then a compile error rather than a listener that never fires.
 */
@Directive({
    selector: 'mm-card',
    standalone: true,
    host: {
        '(mm-card-click)': 'forward(cardClick, $event)',
    },
})
export class MmCardDirective extends MmElementDirective<MmCard> {
    @Input() heading?: string;
    @Input({ transform: booleanInput }) clickable?: boolean;

    @Output() readonly cardClick = new EventEmitter<CustomEvent<void>>();
}
