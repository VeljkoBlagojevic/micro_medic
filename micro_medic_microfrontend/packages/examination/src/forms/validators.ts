import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Form validators for the examination form.
 *
 * Reactive-forms validators rather than a zod schema — which is what `calendar` and `auth` use.
 * That is not inconsistency for its own sake: `@angular/forms` already owns validation state
 * (`touched`, `dirty`, `errors`, and the `ControlValueAccessor` that `MmInputDirective`
 * implements), so a schema resolver here would mean two systems holding the same truth and a
 * bridge to keep them agreeing. Each framework's idiom is used as intended — the same reason
 * `calendar` uses TanStack Query and this package does not.
 *
 * Every rule below mirrors a backend constraint. Client validation here is a courtesy to the
 * doctor, never the enforcement point: `dto/ExaminationRequest` re-checks all of it under
 * `@Valid`, and `GlobalExceptionHandler` returns the field errors if it disagrees.
 */

/** Trimmed length, so a field of spaces fails the backend's `@NotBlank` here instead of on POST. */
export function notBlank(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (typeof value !== 'string' || value.trim().length > 0) return null;
        return { notBlank: true };
    };
}

/**
 * Minimum *trimmed* length. Angular's own `minLength` counts the raw string, so " a " would pass
 * a `minLength(3)` it should fail.
 */
export function minTrimmedLength(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (typeof value !== 'string') return null;

        const length = value.trim().length;
        // Blank is `notBlank`'s error to report; two messages for one empty field is noise.
        if (length === 0 || length >= min) return null;
        return { minTrimmedLength: { requiredLength: min, actualLength: length } };
    };
}

/**
 * Rejects a `datetime-local` value in the future.
 *
 * Mirrors `@PastOrPresent` on `ExaminationRequest.startTime`. The tolerance matters: the backend
 * compares against *its* clock, so a start time of "now" from a client running even slightly ahead
 * would be rejected as future. The form allows a small forward skew and
 * `toSubmittableStartTime` clamps the submitted value to now, which is what keeps a correct form
 * from failing validation on the server.
 */
export function notInFuture(toleranceMs = 0): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (typeof value !== 'string' || value === '') return null;

        const parsed = new Date(value).getTime();
        if (Number.isNaN(parsed)) return { invalidDateTime: true };
        if (parsed <= Date.now() + toleranceMs) return null;

        return { notInFuture: true };
    };
}

/** Rejects a start time absurdly far in the past — almost always a mistyped year. */
export function notBefore(earliest: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (typeof value !== 'string' || value === '') return null;

        const parsed = new Date(value).getTime();
        if (Number.isNaN(parsed)) return { invalidDateTime: true };
        if (parsed >= earliest.getTime()) return null;

        return { notBefore: { earliest: earliest.toISOString() } };
    };
}

/**
 * A whole number of zero or more, for `MedicineUsage.frequencyIntakeInHours`.
 *
 * Zero-or-more, not one-or-more, and the distinction is load-bearing rather than pedantic: the
 * entity's constraint is `@PositiveOrZero`, and `0` is how the dosing dialog encodes "as needed"
 * (*pro re nata*) — a real prescription, not a missing value. A `>= 1` rule here would reject an
 * option the form itself offers, which is the worst kind of client validation: stricter than the
 * server, so the only thing it can do is refuse something valid.
 */
export function nonNegativeInteger(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (value === null || value === '' || value === undefined) return null;

        const parsed = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
            return { nonNegativeInteger: true };
        }
        if (parsed > max) return { max: { max, actual: parsed } };
        return null;
    };
}

/**
 * Human-readable text for the first error on a control, for `[error]` on `<mm-input>`.
 *
 * Centralised rather than written per field: the same rule must read the same way everywhere, and
 * a message built in a template cannot be reused by the summary. Returns `undefined` — not `''` —
 * when there is nothing to show, because `MmElementDirective` skips `undefined` and would
 * otherwise clobber the element's own default.
 */
export function firstErrorMessage(
    control: AbstractControl | null,
    fieldLabel: string
): string | undefined {
    // Only speak up once the doctor has left the field or tried to submit. Validating an
    // untouched form turns a blank page red before anything has been typed.
    if (!control || !control.errors || !(control.touched || control.dirty)) return undefined;

    const errors = control.errors;

    if (errors['required'] || errors['notBlank']) return `${fieldLabel} is required.`;
    if (errors['minTrimmedLength']) {
        const { requiredLength } = errors['minTrimmedLength'] as { requiredLength: number };
        return `${fieldLabel} must be at least ${requiredLength} characters.`;
    }
    if (errors['maxlength']) {
        const { requiredLength } = errors['maxlength'] as { requiredLength: number };
        return `${fieldLabel} must be at most ${requiredLength} characters.`;
    }
    if (errors['invalidDateTime']) return `${fieldLabel} is not a valid date and time.`;
    if (errors['notInFuture']) return `${fieldLabel} cannot be in the future.`;
    if (errors['notBefore']) return `${fieldLabel} is implausibly far in the past.`;
    if (errors['nonNegativeInteger']) return `${fieldLabel} must be a whole number of hours.`;
    if (errors['max']) {
        const { max } = errors['max'] as { max: number };
        return `${fieldLabel} must be at most ${max}.`;
    }

    // A rule was added without a message. Say something useful rather than nothing at all —
    // a silently invalid form that will not submit is the worst of both.
    return `${fieldLabel} is invalid.`;
}
