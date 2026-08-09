import { ApiError } from '@micro-medic/api-client';

/**
 * Maps a thrown value to a message safe to show a user.
 *
 * Every failure from `httpClient` is an `ApiError`, so these read its normalised flags
 * rather than poking at `error.response.data`.
 */
function fieldErrorText(error: ApiError): string | null {
    const messages = Object.values(error.fieldErrors);
    return messages.length > 0 ? messages.join(' ') : null;
}

export function loginErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return 'An unexpected error occurred. Please try again.';
    }
    if (error.isUnauthorized || error.isForbidden) {
        // Deliberately does not distinguish "no such account" from "wrong password" —
        // saying which one would let an attacker enumerate registered email addresses.
        return 'Incorrect email or password.';
    }
    if (error.isValidationError) {
        return fieldErrorText(error) ?? 'Please check your email and password.';
    }
    if (error.isRateLimited) {
        // `RateLimitingFilter` allows 20 requests/minute per IP against `/api/auth/**`,
        // which a few failed logins can reach.
        return 'Too many attempts. Please wait a minute and try again.';
    }
    if (error.isNetworkError) {
        return 'Unable to reach the server. Is the backend running?';
    }
    if (error.isServerError) {
        return 'There was a problem with the server. Please try again later.';
    }
    return 'Could not sign you in. Please try again.';
}

export function registerErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return 'An unexpected error occurred. Please try again.';
    }
    if (error.isConflict) {
        return 'An account with that email already exists.';
    }
    if (error.isValidationError) {
        return fieldErrorText(error) ?? 'Please check the details you entered.';
    }
    if (error.isRateLimited) {
        return 'Too many attempts. Please wait a minute and try again.';
    }
    if (error.isNetworkError) {
        return 'Unable to reach the server. Is the backend running?';
    }
    if (error.isServerError) {
        return 'There was a problem with the server. Please try again later.';
    }
    return 'Could not create your account. Please try again.';
}
