import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getConfig } from './config';
import { ApiError } from './errors';

function createAxiosInstance(): AxiosInstance {
    const instance = axios.create();

    instance.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
        const apiConfig = getConfig();

        requestConfig.baseURL = apiConfig.baseUrl;

        if (!requestConfig.headers['Authorization']) {
            const token = apiConfig.getAuthToken();
            if (token) {
                (requestConfig.headers)['Authorization'] = `Bearer ${token}`;
            }
        }
        return requestConfig;
    });

    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            return response;
        },
        (error: AxiosError) => {
            if (error.response) {
                const { status, statusText, data } = error.response;

                const apiError = new ApiError(status, statusText, data);

                if (apiError.isUnauthorized && getConfig().onUnauthorized) {
                    getConfig().onUnauthorized?.();
                }

                return Promise.reject(apiError);
            }

            return Promise.reject(
                new ApiError(0, 'Network Error', error.message || 'An unknown network error occurred')
            );
        }
    );

    return instance;
}

const globalScope = globalThis as typeof globalThis & { __MICRO_MEDIC_HTTP_CLIENT__?: AxiosInstance };

const api: AxiosInstance = globalScope.__MICRO_MEDIC_HTTP_CLIENT__ ?? (globalScope.__MICRO_MEDIC_HTTP_CLIENT__ = createAxiosInstance());

export const httpClient = {
    get<T>(path: string, params?: Record<string, any>): Promise<T> {
        return api.get<T>(path, { params }).then((response) => response.data);
    },
    post<T>(path: string, body: any): Promise<T> {
        return api.post<T>(path, body).then((response) => response.data);
    },
    put<T>(path: string, body: any): Promise<T> {
        return api.put<T>(path, body).then((response) => response.data);
    },
    patch<T>(path: string, body: any): Promise<T> {
        return api.patch<T>(path, body).then((response) => response.data);
    },
    delete<T>(path: string): Promise<T> {
        return api.delete<T>(path).then((response) => response.data);
    },

    downloadBlob(path: string, params?: Record<string, any>): Promise<Blob> {
        return api
            .get(path, { params, responseType: 'blob' })
            .then((response) => response.data);
    },

    get axios(): AxiosInstance {
        return api;
    }
}