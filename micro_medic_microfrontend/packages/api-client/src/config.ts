export interface ApiClientConfig {
    baseUrl: string;
    getAuthToken: () => string | null;
    onUnauthorized?: () => void;
}

const globalScope = globalThis as typeof globalThis & { __MICRO_MEDIC_API_CLIENT_CONFIG__?: ApiClientConfig };

/**
 * The monolith's address. Hardcoded because none of the webpack configs define
 * `process.env` for the bundles, so there is no build-time hook to read from; a host
 * can call `configureApiClient({ baseUrl })` to point somewhere else.
 */
const DEFAULT_BASE_URL = 'http://localhost:8080';

function defaultConfig(): ApiClientConfig {
    return {
        baseUrl: DEFAULT_BASE_URL,
        // Fallback for hosts that never import the shared store: read the same
        // localStorage key `authStore` persists to.
        getAuthToken: () => (typeof localStorage === 'undefined' ? null : localStorage.getItem('authToken')),
    };
}

/**
 * Merges `config` over whatever is already configured, so partial calls from different
 * micro-frontends compose instead of resetting each other's fields back to defaults.
 */
export function configureApiClient(config: Partial<ApiClientConfig>): void {
    globalScope.__MICRO_MEDIC_API_CLIENT_CONFIG__ = {
        ...getConfig(),
        ...config,
    };
}

export function getConfig(): ApiClientConfig {
    return (
        globalScope.__MICRO_MEDIC_API_CLIENT_CONFIG__ ??
        (globalScope.__MICRO_MEDIC_API_CLIENT_CONFIG__ = defaultConfig())
    );
}
