// import { httpClient } from '../http-client';

import { httpClient } from "./http-client";

export interface DomainService {
    readonly basePath: string;
    get<T>(path: string, params?: Record<string, any>): Promise<T>;
    post<T>(path: string, body: any): Promise<T>;
    put<T>(path: string, body: any): Promise<T>;
    patch<T>(path: string, body: any): Promise<T>;
    delete<T>(path: string): Promise<T>;
    downloadBlob(path: string, params?: Record<string, any>): Promise<Blob>;
}

function joinPath(basePath: string, path: string): string {
    if (!path) return basePath;
    const left = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const right = path.startsWith('/') ? path.slice(1) : path;
    return `${left}/${right}`;
}

export function createService(basePath: string): DomainService {
    return {
        basePath,
        get<T>(path: string, params?: Record<string, any>): Promise<T> {
            const url = joinPath(basePath, path);
            return httpClient.get<T>(url, params);
        },
        post<T>(path: string, body: any): Promise<T> {
            const url = joinPath(basePath, path);
            return httpClient.post<T>(url, body);
        },
        put<T>(path: string, body: any): Promise<T> {
            const url = joinPath(basePath, path);
            return httpClient.put<T>(url, body);
        },
        patch<T>(path: string, body: any): Promise<T> {
            const url = joinPath(basePath, path);
            return httpClient.patch<T>(url, body);
        },
        delete<T>(path: string): Promise<T> {
            const url = joinPath(basePath, path);
            return httpClient.delete<T>(url);
        },
        downloadBlob(path: string, params?: Record<string, any>): Promise<Blob> {
            const url = joinPath(basePath, path);
            return httpClient.downloadBlob(url, params);
        }
    };
}