import { useEffect, useRef } from 'react';
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form';

interface MmFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    label?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
}

export function MmField<T extends FieldValues>({
    control,
    name,
    label,
    type = 'text',
    placeholder,
    required = false,
}: MmFieldProps<T>) {
    const ref = useRef<HTMLElement & {
        value: string;
        error: string;
    }>(null);
    const { field, fieldState: { error } } = useController({
        name,
        control,
    });

    useEffect(() => {
        if (ref.current) {
            ref.current.value = field.value;
        }
    }, [field.value]);

    useEffect(() => {
        if (ref.current) {
            ref.current.error = error ? error.message || 'Invalid value' : '';
        }
    }, [error]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onInput = (event: Event) => {
            const target = event.target as HTMLInputElement;
            field.onChange(target.value);
        };
        const onBlur = () => {
            field.onBlur();
        }
        el.addEventListener('mm-input', onInput);
        el.addEventListener('mm-change', onInput);
        el.addEventListener('blur', onBlur);
        return () => {
            el.removeEventListener('mm-input', onInput);
            el.removeEventListener('mm-change', onInput);
            el.removeEventListener('blur', onBlur);
        };
    }, [field]);

    return (
        <mm-field
            ref={ref}
            label={label}
            type={type}
            placeholder={placeholder}
            required={required}
        />
    );
}
    