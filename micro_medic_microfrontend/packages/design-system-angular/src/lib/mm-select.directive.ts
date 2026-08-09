import {
    Directive,
    EventEmitter,
    Input,
    Output,
    forwardRef,
    type SimpleChanges,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { MmSelect, MmSelectOption } from '@micro-medic/design-system';
import { booleanInput } from './coercion';
import { MmElementDirective } from './custom-element.base';
import type { MmInputEvent } from './mm-input.directive';

/**
 * Typed bindings for `<mm-select>`, plus Angular forms integration.
 *
 * The same `ControlValueAccessor` story as `MmInputDirective`: Angular's built-in
 * `SelectControlValueAccessor` drives a real `<select>` and its `<option>` children, but here
 * both live inside a shadow root and the options come from an `options` property. Implementing
 * the accessor against the composed `mm-input`/`mm-blur` events is what makes `[(ngModel)]` and
 * `formControlName` work on the tag.
 *
 * As with `mm-input`, do not combine `[value]` with a form directive on the same element.
 */
@Directive({
    selector: 'mm-select',
    standalone: true,
    host: {
        '(mm-input)': 'onElementInput($event)',
        '(mm-change)': 'onElementChange($event)',
        '(mm-blur)': 'onElementBlur($event)',
    },
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MmSelectDirective),
            multi: true,
        },
    ],
})
export class MmSelectDirective
    extends MmElementDirective<MmSelect>
    implements ControlValueAccessor
{
    @Input() label?: string;
    @Input() name?: string;
    @Input() value?: string;
    @Input() placeholder?: string;
    @Input() error?: string;
    @Input() hint?: string;

    /** Forwarded as a property — an array cannot survive an attribute binding. */
    @Input() options?: MmSelectOption[];

    @Input({ transform: booleanInput }) disabled?: boolean;
    @Input({ transform: booleanInput }) required?: boolean;

    @Output() readonly valueInput = new EventEmitter<MmInputEvent>();
    @Output() readonly valueChange = new EventEmitter<MmInputEvent>();
    @Output() readonly touched = new EventEmitter<MmInputEvent>();

    /** See `MmInputDirective`: `setDisabledState` and the `@Input` must not fight. */
    protected override readonly nonForwardedInputs = new Set(['disabled']);

    private onChangeFn: (value: string) => void = () => {};
    private onTouchedFn: () => void = () => {};

    // --- ControlValueAccessor ---

    writeValue(value: string | null): void {
        this.nativeElement.value = value ?? '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouchedFn = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.nativeElement.disabled = isDisabled;
    }

    // --- element events ---

    protected onElementInput(event: Event): void {
        this.onChangeFn((event as MmInputEvent).detail.value);
        this.forward(this.valueInput, event);
    }

    protected onElementChange(event: Event): void {
        this.forward(this.valueChange, event);
    }

    protected onElementBlur(event: Event): void {
        this.onTouchedFn();
        this.forward(this.touched, event);
    }

    override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
        if (changes['disabled'] && this.disabled !== undefined) {
            this.nativeElement.disabled = this.disabled;
        }
    }
}
