import { ApiError } from '@micro-medic/api-client';

/**
 * Maps a thrown value to something worth showing a doctor mid-consultation.
 *
 * Same shape as `examination/src/utils/error-message.ts` and `auth`'s: read `ApiError`'s normalised
 * flags rather than poking at `error.response.data`. The messages are this pane's, and there are
 * fewer of them than in `examination` for a real reason — this micro-frontend only reads reference
 * data. `GET /api/diseases/**` is `permitAll` and touches no patient record, so there is no 403 to
 * explain and no `AccessGuard` row-level rule in play. A 401 is still possible (an expired token is
 * rejected before the matcher decides the endpoint is public), which is why the transport branch
 * keeps it.
 */
export function catalogueErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return 'Could not load the ICD-10 catalogue.';
    }

    if (error.isNetworkError) {
        return 'Unable to reach the server. Is the backend running?';
    }
    if (error.isUnauthorized) {
        // `onUnauthorized` has already logged the session out, so the shell is about to redirect.
        // Saying why keeps the redirect from looking like a crash.
        return 'Your session has expired. Please sign in again.';
    }
    if (error.isRateLimited) {
        return 'Too many requests. Please wait a moment and try again.';
    }
    if (error.isServerError) {
        return 'There was a problem with the server. Please try again.';
    }
    if (error.isNotFound) {
        /*
         * Worth distinguishing from an empty search. A 404 here means the *endpoint* is missing —
         * almost always that the catalogue was never seeded, since `POST /api/seeder/disease` is
         * manual and nothing loads `icd10_codes.json` at startup. A search that simply matched
         * nothing returns 200 with an empty page and is handled as the empty state, not as an error.
         */
        return 'The disease catalogue is unavailable. It may not have been seeded yet.';
    }

    return 'Could not load the ICD-10 catalogue. Please try again.';
}
