import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getConfig } from './config';
import { ApiError } from './errors';

/**
 * A 401 on these paths means "these credentials are wrong", not "your session died",
 * so it must not trigger the global `onUnauthorized` logout — that would clear the
 * store while a user is merely mistyping a password.
 */
const UNAUTHENTICATED_PATHS = ['/api/auth/login', '/api/auth/registerPatient', '/api/auth/registerDoctor'];

function isUnauthenticatedPath(url: string | undefined): boolean {
    return !!url && UNAUTHENTICATED_PATHS.some((path) => url.startsWith(path));
}

/**
 * A failed `responseType: 'blob'` request (e.g. `GET /api/reports/{id}/download`) hands
 * back the JSON error body as a `Blob`, which would otherwise surface as an unreadable
 * `[object Blob]`. Read it into an object so `ApiError.message` says something useful.
 */
async function readErrorBody(data: unknown): Promise<unknown> {
    if (typeof Blob === 'undefined' || !(data instanceof Blob)) return data;
    try {
        const text = await data.text();
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    } catch {
        return data;
    }
}

function createAxiosInstance(): AxiosInstance {
    const instance = axios.create();

    instance.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
        const apiConfig = getConfig();

        requestConfig.baseURL = apiConfig.baseUrl;

        if (!requestConfig.headers['Authorization']) {
            const token = apiConfig.getAuthToken();
            if (token) {
                requestConfig.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return requestConfig;
    });

    instance.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error: AxiosError) => {
            if (error.response) {
                const { status, statusText, data } = error.response;
                const body = await readErrorBody(data);
                const apiError = new ApiError(status, statusText, body);

                if (apiError.isUnauthorized && !isUnauthenticatedPath(error.config?.url)) {
                    getConfig().onUnauthorized?.();
                }

                return Promise.reject(apiError);
            }

            // No response at all: server unreachable, request cancelled, or blocked by CORS.
            return Promise.reject(
                new ApiError(0, 'Network Error', error.message || 'An unknown network error occurred')
            );
        }
    );

    return instance;
}

const globalScope = globalThis as typeof globalThis & { __MICRO_MEDIC_HTTP_CLIENT__?: AxiosInstance };

/**
 * One axios instance shared by every federated bundle. Deduped through `globalThis`
 * because Module Federation can still instantiate this module more than once, and the
 * interceptors must be registered exactly once.
 */
const api: AxiosInstance = globalScope.__MICRO_MEDIC_HTTP_CLIENT__ ?? (globalScope.__MICRO_MEDIC_HTTP_CLIENT__ = createAxiosInstance());

export const httpClient = {
    get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
        return api.get<T>(path, { params }).then((response) => response.data);
    },
    post<T>(path: string, body?: unknown): Promise<T> {
        return api.post<T>(path, body).then((response) => response.data);
    },
    put<T>(path: string, body?: unknown): Promise<T> {
        return api.put<T>(path, body).then((response) => response.data);
    },
    patch<T>(path: string, body?: unknown): Promise<T> {
        return api.patch<T>(path, body).then((response) => response.data);
    },
    delete<T>(path: string): Promise<T> {
        return api.delete<T>(path).then((response) => response.data);
    },

    downloadBlob(path: string, params?: Record<string, unknown>): Promise<Blob> {
        return api
            .get<Blob>(path, { params, responseType: 'blob' })
            .then((response) => response.data);
    },

    /** Escape hatch for the rare call that needs the raw instance. */
    get axios(): AxiosInstance {
        return api;
    }
};
