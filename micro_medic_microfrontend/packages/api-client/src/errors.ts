export class ApiError extends Error {
    public readonly status: number;
    public readonly statusText: string;
    public readonly data: any;

    constructor(status: number, statusText: string, body: any) {
        const errorMessage = typeof body === 'object' && body !== null && 'message' in body ? body.message : statusText;
        super(`API Error: ${status} ${statusText} - ${errorMessage}`);
        this.status = status;
        this.statusText = statusText;
        this.data = body;
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

    get isServerError(): boolean {
        return this.status >= 500 && this.status < 600;
    }

    get isValidationError(): boolean {
        return this.status === 422 || this.status === 400;
    }

    get isClientError(): boolean {
        return this.status >= 400 && this.status < 500;
    }
}