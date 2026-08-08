import { MmField } from '@micro-medic/design-system-react';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

/**
 * react-hook-form ↔ design-system bridge.
 *
 * The generic form binding lives here rather than in `@micro-medic/design-system-react`, so
 * the design system stays free of a form-library dependency. `MmField` handles the Lit
 * property/event plumbing; this component only maps a `control` + `name` onto it.
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
    multiline?: boolean;
    rows?: number;
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
    multiline = false,
    rows,
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
            multiline={multiline}
            rows={rows}
        />
    );
}
