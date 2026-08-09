import { Directive, EventEmitter, Input, Output } from '@angular/core';
import type { MmToastRegion, ToastRecord } from '@micro-medic/design-system';
import { numberInput } from './coercion';
import { MmElementDirective } from './custom-element.base';

/**
 * Typed bindings for `<mm-toast-region>`.
 *
 * Note what this directive does *not* do: there is no `[toasts]` input. The element's API is
 * imperative because a notification is an event rather than state — a component holding an array
 * would have to prune expired entries itself and would fight the element over ownership of the
 * list. So the two configuration properties are inputs and the rest is reached through
 * `nativeElement`:
 *
 * ```html
 * <mm-toast-region #region placement="top-right" (toastDismiss)="onDismissed($event.detail.id)" />
 * ```
 * ```ts
 * readonly region = viewChild.required(MmToastRegionDirective);
 * notify(message: string) { this.region().show({ message, type: 'success', duration: 5000 }); }
 * ```
 *
 * `show`/`dismiss`/`clear` are inherited from the element via `nativeElement`, which the base
 * class types as `MmToastRegion` — so they are checked without being redeclared here.
 */
@Directive({
    selector: 'mm-toast-region',
    standalone: true,
    host: {
        '(mm-toast-dismiss)': 'forward(toastDismiss, $event)',
    },
})
export class MmToastRegionDirective extends MmElementDirective<MmToastRegion> {
    @Input() placement?: 'top-right' | 'top-center' | 'bottom-right';

    /** Most toasts on screen at once; the oldest is dropped beyond it. Defaults to 4. */
    @Input({ transform: numberInput }) max?: number;

    /** Fires for every removal — a click, an expiry, or a programmatic `dismiss(id)`. */
    @Output() readonly toastDismiss = new EventEmitter<CustomEvent<{ id: string }>>();

    /** Convenience passthrough, so a caller with the directive need not reach for the element. */
    show(record: Omit<ToastRecord, 'id'> & { id?: string }): string {
        return this.nativeElement.show(record);
    }
}
