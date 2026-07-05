export interface ApiClientConfig {
    baseUrl: string;
    getAuthToken: () => string | null;
    onUnauthorized?: () => void;
}

const globalScope = globalThis as typeof globalThis & { __MICRO_MEDIC_API_CLIENT_CONFIG__?: ApiClientConfig };

function defaultConfig(): ApiClientConfig {
    return {
        baseUrl: 'localhost:8080',
        getAuthToken: () => localStorage.getItem('authToken'),
    };
}

export function configureApiClient(config: Partial<ApiClientConfig>): void {
    globalScope.__MICRO_MEDIC_API_CLIENT_CONFIG__ = {
        ...defaultConfig(),
        ...config,
    };
}

export function getConfig(): ApiClientConfig {
    return (
        globalScope.__MICRO_MEDIC_API_CLIENT_CONFIG__ ??
        (globalScope.__MICRO_MEDIC_API_CLIENT_CONFIG__ = defaultConfig())
    );
}