import { MmSelectField, type MmSelectOption } from '@micro-medic/design-system-react';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

/**
 * react-hook-form ↔ `<mm-select>` bridge, the counterpart to [MmFormField].
 *
 * The DOM has no numeric select value, so the element always reports a string. Rather than
 * make every caller remember that, `numeric` converts on the way out — an empty selection
 * becomes `undefined` (not `NaN`, which zod reports as "expected number, received nan" and
 * reads like a bug to the user) so the field's own "required" message wins.
 */
interface MmSelectFormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    options: MmSelectOption[];
    label?: string;
    placeholder?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    numeric?: boolean;
}

export function MmSelectFormField<T extends FieldValues>({
    control,
    name,
    options,
    label,
    placeholder,
    hint,
    required = false,
    disabled = false,
    numeric = false,
}: MmSelectFormFieldProps<T>) {
    const {
        field,
        fieldState: { error },
    } = useController({ name, control });

    return (
        <MmSelectField
            name={field.name}
            value={field.value == null ? '' : String(field.value)}
            onValueChange={(value) => {
                if (!numeric) {
                    field.onChange(value);
                    return;
                }
                field.onChange(value === '' ? undefined : Number(value));
            }}
            onBlur={field.onBlur}
            options={options}
            label={label}
            placeholder={placeholder}
            hint={hint}
            error={error?.message}
            required={required}
            disabled={disabled}
        />
    );
}
