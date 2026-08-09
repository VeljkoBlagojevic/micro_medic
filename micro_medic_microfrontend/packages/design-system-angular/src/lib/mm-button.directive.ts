import { Directive, Input } from '@angular/core';
import type { ButtonSize, ButtonType, ButtonVariant, MmButton } from '@micro-medic/design-system';
import { booleanInput } from './coercion';
import { MmElementDirective } from './custom-element.base';

/**
 * Typed bindings for `<mm-button>`.
 *
 * `click` needs no output: it is a native event that already bubbles, so Angular's own
 * `(click)` binding works on the host element unchanged.
 */
@Directive({
    selector: 'mm-button',
    standalone: true,
})
export class MmButtonDirective extends MmElementDirective<MmButton> {
    @Input() variant?: ButtonVariant;
    @Input() size?: ButtonSize;
    @Input() type?: ButtonType;
    @Input() label?: string;

    /** Coerced so the bare attribute form (`<mm-button disabled>`) means `true`. */
    @Input({ transform: booleanInput }) disabled?: boolean;
    @Input({ transform: booleanInput }) loading?: boolean;
    @Input({ transform: booleanInput }) fullWidth?: boolean;
}
