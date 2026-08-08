import type { ApiErrorResponse } from '@micro-medic/shared-types';

/** `true` when the body looks like the backend's `exception/ApiError` payload. */
function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
    return typeof body === 'object' && body !== null && typeof (body as ApiErrorResponse).message === 'string';
}

/**
 * Every failed request from `httpClient` rejects with this. `data` is the raw response
 * body — usually an `ApiErrorResponse`, but `/api/auth/**` rate limiting returns a bare
 * `{"error": "..."}` and a network failure has no body at all.
 */
export class ApiError extends Error {
    public readonly status: number;
    public readonly statusText: string;
    public readonly data: unknown;

    constructor(status: number, statusText: string, body: unknown) {
        super(`API Error: ${status} ${statusText} - ${ApiError.describe(statusText, body)}`);
        // Restore the prototype chain so `instanceof ApiError` keeps working after the
        // downlevelling that otherwise breaks `Error` subclassing.
        Object.setPrototypeOf(this, ApiError.prototype);
        this.name = 'ApiError';
        this.status = status;
        this.statusText = statusText;
        this.data = body;
    }

    private static describe(statusText: string, body: unknown): string {
        if (isApiErrorResponse(body)) return body.message;
        if (typeof body === 'string' && body) return body;
        // `RateLimitingFilter` returns `{"error": "..."}` rather than an ApiError.
        if (typeof body === 'object' && body !== null && typeof (body as { error?: unknown }).error === 'string') {
            return (body as { error: string }).error;
        }
        return statusText;
    }

    /** The typed backend error body, or `null` when the response was not one. */
    get apiErrorResponse(): ApiErrorResponse | null {
        return isApiErrorResponse(this.data) ? this.data : null;
    }

    /** Per-field validation messages from `MethodArgumentNotValidException`, keyed by field name. */
    get fieldErrors(): Record<string, string> {
        return this.apiErrorResponse?.fieldErrors ?? {};
    }

    /** No response arrived at all (server down, CORS rejection, DNS failure). */
    get isNetworkError(): boolean {
        return this.status === 0;
    }

    get isUnauthorized(): boolean {
        return this.status === 401;
    }

    get isForbidden(): boolean {
        return this.status === 403;
    }

    get isNotFound(): boolean {
        return this.status === 404;
    }

    get isConflict(): boolean {
        return this.status === 409;
    }

    /** `RateLimitingFilter` returns 429 above 20 `/api/auth/**` requests per minute. */
    get isRateLimited(): boolean {
        return this.status === 429;
    }

    get isServerError(): boolean {
        return this.status >= 500 && this.status < 600;
    }

    get isValidationError(): boolean {
        return this.status === 400 || this.status === 422;
    }

    get isClientError(): boolean {
        return this.status >= 400 && this.status < 500;
    }
}
