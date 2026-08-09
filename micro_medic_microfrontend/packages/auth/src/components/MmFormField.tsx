import { MmField } from '@micro-medic/design-system-react';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

/**
 * react-hook-form ↔ design-system bridge.
 *
 * The same shape as `calendar`'s copy, and deliberately duplicated rather than hoisted into
 * `@micro-medic/design-system-react`: the design system must not depend on a form library,
 * or every consumer inherits that choice. Independently deployable micro-frontends are
 * allowed to pick different form libraries; a ~40-line adapter per package is the price of
 * that autonomy, and it is cheaper than the coupling.
 */
interface MmFormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    label?: string;
    type?: string;
    placeholder?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    autoComplete?: string;
}

export function MmFormField<T extends FieldValues>({
    control,
    name,
    label,
    type = 'text',
    placeholder,
    hint,
    required = false,
    disabled = false,
    autoComplete,
}: MmFormFieldProps<T>) {
    const {
        field,
        fieldState: { error },
    } = useController({ name, control });

    return (
        <MmField
            name={field.name}
            // A react-hook-form value can be `undefined` before the first change; the Lit
            // element's `value` property is typed `string`, so normalise here.
            value={field.value == null ? '' : String(field.value)}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            label={label}
            type={type}
            placeholder={placeholder}
            hint={hint}
            error={error?.message}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
        />
    );
}
