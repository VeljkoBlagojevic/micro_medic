import {
    Directive,
    EventEmitter,
    Input,
    Output,
    forwardRef,
    type SimpleChanges,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { MmInput } from '@micro-medic/design-system';
import { booleanInput, numberInput } from './coercion';
import { MmElementDirective } from './custom-element.base';

/** Payload shared by `mm-input`, `mm-change` and `mm-blur`. */
export type MmInputEvent = CustomEvent<{ value: string; name: string }>;

/**
 * Typed bindings for `<mm-input>`, plus Angular forms integration.
 *
 * This is the only directive here that does more than forward properties. `<mm-input>` is not a
 * form-associated custom element, so Angular's built-in `DefaultValueAccessor` cannot drive it:
 * that accessor listens for the native `input` event and writes `element.value` on a real
 * `<input>`. Here the real control is inside a shadow root, and the component re-publishes its
 * changes as the composed `mm-input` / `mm-change` / `mm-blur` events. Implementing
 * `ControlValueAccessor` against those events is what makes `[(ngModel)]` and `formControlName`
 * work on the tag with no extra glue at the call site — the Angular equivalent of what
 * `MmField` does for react-hook-form on the React side.
 *
 * Do not combine `[value]` with a form directive on the same element: the form control and the
 * template binding would both claim ownership of the value. Pick one.
 */
@Directive({
    selector: 'mm-input',
    standalone: true,
    host: {
        '(mm-input)': 'onElementInput($event)',
        '(mm-change)': 'onElementChange($event)',
        '(mm-blur)': 'onElementBlur($event)',
    },
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            // `forwardRef` because the class is still being defined at decorator-evaluation time.
            useExisting: forwardRef(() => MmInputDirective),
            multi: true,
        },
    ],
})
export class MmInputDirective extends MmElementDirective<MmInput> implements ControlValueAccessor {
    @Input() label?: string;
    @Input() name?: string;
    @Input() type?: string;
    @Input() value?: string;
    @Input() placeholder?: string;
    @Input() error?: string;
    @Input() hint?: string;
    @Input() autocomplete?: string;
    @Input() min?: string;
    @Input() max?: string;
    @Input() step?: string;

    @Input({ transform: booleanInput }) disabled?: boolean;
    @Input({ transform: booleanInput }) readonly?: boolean;
    @Input({ transform: booleanInput }) required?: boolean;
    @Input({ transform: booleanInput }) multiline?: boolean;

    /** Textarea height when `multiline` is set. Coerced so `rows="4"` forwards as a number. */
    @Input({ transform: numberInput }) rows?: number;

    /** Fires on every keystroke — the value has already been written to the element. */
    @Output() readonly valueInput = new EventEmitter<MmInputEvent>();
    /** Fires on commit (blur or Enter), mirroring the native `change` semantics. */
    @Output() readonly valueChange = new EventEmitter<MmInputEvent>();
    @Output() readonly touched = new EventEmitter<MmInputEvent>();

    /**
     * `disabled` is both an `@Input` and something a form control may set via
     * `setDisabledState`. It is excluded from generic forwarding so the two paths cannot fight:
     * `ngOnChanges` would otherwise re-assert a stale binding over the control's own state.
     */
    protected override readonly nonForwardedInputs = new Set(['disabled']);

    private onChangeFn: (value: string) => void = () => {};
    private onTouchedFn: () => void = () => {};

    // --- ControlValueAccessor ---

    writeValue(value: string | null): void {
        // The element's `value` is a plain string, so nullish becomes '' rather than the
        // literal text "null" appearing in the field.
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

    /**
     * These take `Event` because that is how Angular types `$event` for a non-DOM event name in
     * a host listener; `forward` does the narrowing (see `MmElementDirective.forward`).
     */
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

    /** Applies the `disabled` binding, which generic forwarding deliberately skips. */
    override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
        if (changes['disabled'] && this.disabled !== undefined) {
            this.nativeElement.disabled = this.disabled;
        }
    }
}
