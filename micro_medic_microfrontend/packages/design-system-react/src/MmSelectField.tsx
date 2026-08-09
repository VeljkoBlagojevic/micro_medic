import * as React from 'react';
import type { MmSelect as MmSelectElement, MmSelectOption } from '@micro-medic/design-system';
import { MmSelect } from './components';
import { valueOf, type MmInputEvent } from './types';

/**
 * Controlled `<mm-select>`, the counterpart to `MmField`.
 *
 * Same contract deliberately: `value` + `onValueChange` as strings, no form library. A caller
 * that needs a number converts at its own edge — the DOM has no numeric select value, and
 * pretending otherwise here would push a `string | number` union into every consumer.
 */
export interface MmSelectFieldProps {
    name: string;
    value: string;
    onValueChange: (value: string) => void;
    onBlur?: () => void;
    options: MmSelectOption[];
    label?: string;
    placeholder?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export const MmSelectField = React.forwardRef<MmSelectElement, MmSelectFieldProps>(
    function MmSelectField(
        {
            name,
            value,
            onValueChange,
            onBlur,
            options,
            label,
            placeholder,
            error,
            hint,
            required = false,
            disabled = false,
            className,
        },
        ref
    ) {
        const handleInput = React.useCallback(
            (event: Event) => onValueChange(valueOf(event as MmInputEvent)),
            [onValueChange]
        );

        return (
            <MmSelect
                ref={ref}
                className={className}
                name={name}
                value={value ?? ''}
                // A property, not an attribute: an array of objects would stringify to
                // "[object Object]" if React set it as an attribute.
                options={options}
                label={label ?? ''}
                placeholder={placeholder ?? ''}
                error={error ?? ''}
                hint={hint ?? ''}
                required={required}
                disabled={disabled}
                onInput={handleInput}
                onBlur={onBlur}
            />
        );
    }
);
