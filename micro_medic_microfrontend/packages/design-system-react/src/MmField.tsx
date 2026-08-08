import * as React from 'react';
import { MmInput } from './components';
import { valueOf, type MmInputEvent } from './types';

/**
 * Controlled `<mm-input>` for use with any React form library — or none.
 *
 * Deliberately library-agnostic: it takes `value`/`onValueChange` rather than a
 * react-hook-form `control`, so the design-system package does not depend on a form library.
 * The react-hook-form binding lives in the consuming MFE (see `calendar`'s `MmFormField`),
 * which is where that dependency belongs.
 */
export interface MmFieldProps {
    name: string;
    value: string;
    onValueChange: (value: string) => void;
    onBlur?: () => void;
    label?: string;
    type?: string;
    placeholder?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    multiline?: boolean;
    rows?: number;
    autoComplete?: string;
    min?: string;
    max?: string;
    step?: string;
    className?: string;
}

export const MmField = React.forwardRef<HTMLElement, MmFieldProps>(function MmField(
    {
        name,
        value,
        onValueChange,
        onBlur,
        label,
        type = 'text',
        placeholder,
        error,
        hint,
        required = false,
        disabled = false,
        readOnly = false,
        multiline = false,
        rows,
        autoComplete,
        min,
        max,
        step,
        className,
    },
    ref
) {
    const handleInput = React.useCallback(
        (event: Event) => onValueChange(valueOf(event as MmInputEvent)),
        [onValueChange]
    );

    return (
        <MmInput
            ref={ref}
            className={className}
            name={name}
            // `value` is assigned as a property by @lit/react, so resets propagate.
            value={value ?? ''}
            label={label ?? ''}
            type={type}
            placeholder={placeholder ?? ''}
            error={error ?? ''}
            hint={hint ?? ''}
            required={required}
            disabled={disabled}
            readonly={readOnly}
            multiline={multiline}
            rows={rows}
            autocomplete={autoComplete ?? ''}
            min={min ?? ''}
            max={max ?? ''}
            step={step ?? ''}
            onInput={handleInput}
            onBlur={onBlur}
        />
    );
});
