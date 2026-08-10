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
    /**
     * Report the value as a number rather than a string — the same flag [MmSelectFormField]
     * carries, for the same reason.
     *
     * `type="number"` only constrains what the *browser* accepts; the element's `value`
     * property, and therefore the `mm-input` detail, is still a string. Without this,
     * `specializationId` reached `z.number()` as `"3"` and the field showed zod's "expected
     * number, received string" — so the degraded branch of the doctor registration form (the one
     * shown when the department list fails to load) could not be submitted at all. An empty box
     * becomes `undefined` rather than `NaN`, so the schema's "Select a specialization" `.refine`
     * is what speaks instead of a type error.
     */
    numeric?: boolean;
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
    numeric = false,
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
            onValueChange={(value) => {
                if (!numeric) {
                    field.onChange(value);
                    return;
                }
                field.onChange(value === '' ? undefined : Number(value));
            }}
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
