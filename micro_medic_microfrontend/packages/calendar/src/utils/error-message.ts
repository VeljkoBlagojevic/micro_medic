import { ApiError } from '@micro-medic/api-client';

/**
 * Maps a thrown value to a message safe to show a user.
 *
 * Every failure from `httpClient` is an `ApiError`, so these read the normalised shape
 * (`isConflict`, `isNetworkError`, …) rather than poking at `error.response.data`.
 */
export function bookingErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return 'An unexpected error occurred. Please try again.';
    }
    if (error.isConflict) {
        return 'That time slot conflicts with another booking. Please choose a different time.';
    }
    if (error.isValidationError) {
        // A 400 carries per-field messages; surface them since they are actionable.
        const fieldMessages = Object.values(error.fieldErrors);
        return fieldMessages.length > 0
            ? fieldMessages.join(' ')
            : 'Please check the appointment details and try again.';
    }
    if (error.isForbidden) {
        return 'You can only modify your own appointments.';
    }
    if (error.isUnauthorized) {
        return 'Your session has expired. Please log in again.';
    }
    if (error.isNotFound) {
        return 'The appointment you are trying to modify no longer exists.';
    }
    if (error.isRateLimited) {
        return 'Too many requests. Please wait a moment and try again.';
    }
    if (error.isNetworkError) {
        return 'Unable to reach the server. Check your connection and try again.';
    }
    if (error.isServerError) {
        return 'There was a problem with the server. Please try again later.';
    }
    return 'An unexpected error occurred. Please try again.';
}

export function loadErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.isUnauthorized) {
            return 'Your session has expired. Please log in again.';
        }
        if (error.isNetworkError) {
            return 'Unable to reach the calendar service. Check your connection and try again.';
        }
        if (error.isServerError) {
            return 'There was a problem with the calendar service. Please try again later.';
        }
    }
    return 'Could not load the calendar. Please try again later.';
}

export function searchErrorMessage(error: unknown): string {
    if (error instanceof ApiError && error.isNetworkError) {
        return 'Unable to reach the server. Check your connection and try again.';
    }
    return 'Could not search for patients. Please try again.';
}
