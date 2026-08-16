export interface ApiClientConfig {
    baseUrl: string;
    getAuthToken: () => string | null;
    onUnauthorized?: () => void;
}

const globalScope = globalThis as typeof globalThis & {
    __MICRO_MEDIC_API_CLIENT_CONFIG__?: ApiClientConfig;
    __MICRO_MEDIC_API_CLIENT_CLAIMS__?: Set<keyof ApiClientConfig>;
};

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
 * Which fields have been configured, as opposed to left at their default. On `globalThis` because
 * Module Federation may evaluate this module twice, and a per-copy set would believe every field was
 * unclaimed — precisely the case this exists to detect.
 */
function claims(): Set<keyof ApiClientConfig> {
    return (
        globalScope.__MICRO_MEDIC_API_CLIENT_CLAIMS__ ??
        (globalScope.__MICRO_MEDIC_API_CLIENT_CLAIMS__ = new Set<keyof ApiClientConfig>())
    );
}

/**
 * First writer wins, permanently. A second writer offering the same value is the harmless
 * duplicate-evaluation case; a different value is a real conflict, reported rather than applied.
 */
function mayClaim<K extends keyof ApiClientConfig>(
    key: K,
    incoming: ApiClientConfig[K],
    current: ApiClientConfig[K]
): boolean {
    if (!claims().has(key)) {
        claims().add(key);
        return true;
    }

    if (incoming === current) return false;

    console.error(
        `[api-client] Ignoring a second '${key}' from configureApiClient — it is already configured. ` +
            'One micro-frontend owns each field; see packages/api-client/src/config.ts.'
    );
    return false;
}

/**
 * Configures the shared HTTP client. **Per field, the first caller wins.**
 *
 * The merge this replaced was last-writer-wins across independently deployed remotes — behaviour
 * decided by whichever container webpack evaluated last, and the field it raced over is
 * `getAuthToken`, i.e. signing every request with the wrong session.
 *
 * Per *field* rather than one-shot, because composing disjoint partials is the legitimate use:
 * `shared-store` claims `getAuthToken`/`onUnauthorized` on import, a host pointing elsewhere claims
 * `baseUrl`. It reports and keeps the first claim rather than throwing — the call sits at module scope
 * inside a remote, so a throw takes the document down over a condition that already works.
 */
export function configureApiClient(config: Partial<ApiClientConfig>): void {
    const current = getConfig();
    const next: ApiClientConfig = { ...current };

    // Per field rather than looped: a generic loop over `keyof` cannot narrow the value type without
    // a cast that would defeat the point.
    if (config.baseUrl !== undefined && mayClaim('baseUrl', config.baseUrl, current.baseUrl)) {
        next.baseUrl = config.baseUrl;
    }
    if (
        config.getAuthToken !== undefined &&
        mayClaim('getAuthToken', config.getAuthToken, current.getAuthToken)
    ) {
        next.getAuthToken = config.getAuthToken;
    }
    if (
        config.onUnauthorized !== undefined &&
        mayClaim('onUnauthorized', config.onUnauthorized, current.onUnauthorized)
    ) {
        next.onUnauthorized = config.onUnauthorized;
    }

    globalScope.__MICRO_MEDIC_API_CLIENT_CONFIG__ = next;
}

export function getConfig(): ApiClientConfig {
    return (
        globalScope.__MICRO_MEDIC_API_CLIENT_CONFIG__ ??
        (globalScope.__MICRO_MEDIC_API_CLIENT_CONFIG__ = defaultConfig())
    );
}
