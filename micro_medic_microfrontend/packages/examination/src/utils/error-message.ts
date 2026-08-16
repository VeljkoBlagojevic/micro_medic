import { ApiError } from '@micro-medic/api-client';

/**
 * Maps a thrown value to a message safe to show a doctor mid-consultation.
 *
 * Same shape as `auth/src/utils/error-message.ts` — read `ApiError`'s normalised flags rather than
 * poking at `error.response.data` — but the messages are this domain's. The distinctions that
 * matter here are clinical workflow ones: a 403 means "not your patient" (and has already been
 * written to the audit log by `AccessGuard`), while the 400s from `ExaminationService.examine` are
 * all recoverable states the doctor can act on.
 */
function fieldErrorText(error: ApiError): string | null {
    const messages = Object.values(error.fieldErrors);
    return messages.length > 0 ? messages.join(' ') : null;
}

/** Shared tail: the failures that mean the same thing regardless of what was being attempted. */
function transportMessage(error: ApiError): string | null {
    if (error.isNetworkError) return 'Unable to reach the server. Is the backend running?';
    if (error.isServerError) return 'There was a problem with the server. Please try again.';
    if (error.isUnauthorized) {
        // The api-client's `onUnauthorized` has already logged the session out, so the shell is
        // about to redirect. Say why, so the redirect is not mysterious.
        return 'Your session has expired. Please sign in again.';
    }
    return null;
}

export function examineErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return 'An unexpected error occurred. The examination was not saved.';
    }

    const transport = transportMessage(error);
    if (transport) return transport;

    if (error.isForbidden) {
        /*
         * `ExaminationService.examine` requires `ROLE_DOCTOR`, and `AccessGuard` additionally
         * requires an appointment linking this doctor to this patient. Both arrive as 403.
         */
        return 'You are not authorised to record an examination for this patient.';
    }

    if (error.isValidationError) {
        /*
         * `examine` throws `IllegalArgumentException` for four distinct recoverable states — the
         * appointment is missing, it is not `SCHEDULED`, it already has an examination, or the
         * diagnosis code is unknown. `GlobalExceptionHandler` turns each into a 400 whose
         * `message` names the specific case, so the backend's own text is more useful here than
         * anything this function could guess.
         */
        return fieldErrorText(error) ?? error.apiErrorResponse?.message ?? 'Please check the form and try again.';
    }

    if (error.isNotFound) {
        return 'The appointment or diagnosis could not be found. It may have been changed elsewhere.';
    }

    return 'Could not record the examination. Please try again.';
}

export function loadErrorMessage(error: unknown, subject: string): string {
    if (!(error instanceof ApiError)) return `Could not load ${subject}.`;

    const transport = transportMessage(error);
    if (transport) return transport;

    if (error.isForbidden) {
        // Worth being explicit: this is the row-level rule in `AccessGuard`, not a bug. A doctor
        // may read a patient only while an appointment links them.
        return `You do not have access to ${subject} for this patient.`;
    }
    if (error.isNotFound) return `No ${subject} found.`;

    return `Could not load ${subject}. Please try again.`;
}

/**
 * The appointment named by `?appointmentId=` could not be adopted. A 403 here is an ordinary outcome
 * rather than a bug — someone followed a link to an appointment that is not theirs — so every branch
 * points at the picker instead of implying something broke.
 */
export function adoptAppointmentErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) return 'Could not open that appointment. Choose one below.';

    const transport = transportMessage(error);
    if (transport) return transport;

    if (error.isForbidden) {
        return 'That appointment is not one of yours to examine. Choose one of your own below.';
    }
    if (error.isNotFound) {
        return 'That appointment no longer exists. Choose one below.';
    }

    return 'Could not open that appointment. Choose one below.';
}

export function reportErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) return 'Could not generate the report.';

    const transport = transportMessage(error);
    if (transport) return transport;

    if (error.isForbidden) return 'You are not authorised to generate this report.';
    if (error.isNotFound) return 'The examination could not be found.';

    return 'Could not generate the report. The examination itself was saved.';
}
