import { httpClient } from "./http-client";

export interface DomainService {
    readonly basePath: string;
    get<T>(path?: string, params?: Record<string, unknown>): Promise<T>;
    post<T>(path?: string, body?: unknown): Promise<T>;
    put<T>(path?: string, body?: unknown): Promise<T>;
    patch<T>(path?: string, body?: unknown): Promise<T>;
    delete<T>(path?: string): Promise<T>;
    downloadBlob(path?: string, params?: Record<string, unknown>): Promise<Blob>;
}

/**
 * Normalises `basePath` to exactly one leading slash and no trailing slash.
 *
 * The leading slash matters: axios resolves a relative path against the *page* path,
 * so `createService('api/patients')` called from `http://localhost:3009/some/route`
 * would hit `/some/api/patients`. Callers pass both spellings, so accept both.
 */
function normalizeBasePath(basePath: string): string {
    return `/${basePath.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

/**
 * Joins a normalised base with a sub-path. An empty or `'/'` sub-path yields the base
 * itself — Spring registers `GET /api/calendar`, and a trailing slash is a different
 * (unmapped) path under Spring 6+ since trailing-slash matching was removed.
 */
function joinPath(basePath: string, path?: string): string {
    const right = (path ?? '').replace(/^\/+/, '');
    return right ? `${basePath}/${right}` : basePath;
}

/**
 * Builds a thin typed wrapper around `httpClient` bound to one backend path prefix.
 * The verbs already unwrap the response body, so callers never see an `AxiosResponse`.
 */
export function createService(basePath: string): DomainService {
    const base = normalizeBasePath(basePath);

    return {
        basePath: base,
        get<T>(path?: string, params?: Record<string, unknown>): Promise<T> {
            return httpClient.get<T>(joinPath(base, path), params);
        },
        post<T>(path?: string, body?: unknown): Promise<T> {
            return httpClient.post<T>(joinPath(base, path), body);
        },
        put<T>(path?: string, body?: unknown): Promise<T> {
            return httpClient.put<T>(joinPath(base, path), body);
        },
        patch<T>(path?: string, body?: unknown): Promise<T> {
            return httpClient.patch<T>(joinPath(base, path), body);
        },
        delete<T>(path?: string): Promise<T> {
            return httpClient.delete<T>(joinPath(base, path));
        },
        downloadBlob(path?: string, params?: Record<string, unknown>): Promise<Blob> {
            return httpClient.downloadBlob(joinPath(base, path), params);
        }
    };
}
