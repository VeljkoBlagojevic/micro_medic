import type { Role, UserDto } from '@micro-medic/shared-types';
import { EventTypes } from '@micro-medic/shared-types';
import { authService, configureApiClient } from '@micro-medic/api-client';
import { eventBus } from './event-bus';

type Subscriber = (state: AuthState) => void;

const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';

export interface AuthState {
    token: string | null;
    user: UserDto | null;
    role: Role | null;
    isAuthenticated: boolean;
}

/**
 * Reads the persisted user. A malformed value (hand-edited, or written by an older
 * build) must not throw at module scope: importing this file *is* the api-client
 * bootstrap, so a throw here would take down every micro-frontend that imports it.
 */
function readStoredUser(): UserDto | null {
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(USER_KEY);
    } catch {
        // Some privacy modes make localStorage throw on access rather than return null.
        return null;
    }
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as UserDto | null;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        console.warn('[AuthStore] Discarding unparseable persisted user.');
        try {
            localStorage.removeItem(USER_KEY);
        } catch {
            /* nothing further we can do */
        }
        return null;
    }
}

function readStoredToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

function createAuthStore() {
    let token: string | null = readStoredToken();
    let user: UserDto | null = readStoredUser();
    let isAuthenticated: boolean = !!token && !!user;
    const subscribers: Set<Subscriber> = new Set<Subscriber>();

    // Importing this module IS the api-client bootstrap: it tells the shared axios
    // instance where to find the token and what to do when the backend rejects it.
    configureApiClient({
        getAuthToken: () => token,
        onUnauthorized: () => store.logout(),
    });

    function getState(): AuthState {
        // `role` is derived rather than stored — one less field to keep in sync.
        return { token, user, role: user?.role ?? null, isAuthenticated };
    }

    function notify(): void {
        const snapshot = getState();
        subscribers.forEach((subscriber) => {
            try {
                subscriber(snapshot);
            } catch (error) {
                console.error('[AuthStore] Error in subscriber callback:', error);
            }
        });
    }

    function persist(): void {
        try {
            if (token) localStorage.setItem(TOKEN_KEY, token);
            else localStorage.removeItem(TOKEN_KEY);

            if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
            else localStorage.removeItem(USER_KEY);
        } catch (error) {
            // Quota exceeded or storage disabled: in-memory state is still correct for
            // this tab, it just will not survive a reload.
            console.warn('[AuthStore] Could not persist auth state:', error);
        }
    }

    const store = {
        getToken(): string | null {
            return token;
        },

        getUser(): UserDto | null {
            return user;
        },

        getRole(): Role | null {
            return user?.role ?? null;
        },

        isAuthenticated(): boolean {
            return isAuthenticated;
        },

        getState,

        login(newToken: string, newUser: UserDto): void {
            token = newToken;
            user = newUser;
            isAuthenticated = true;

            persist();
            notify();

            eventBus.emit(EventTypes.AUTH_LOGIN, { token: newToken, user: newUser });
        },

        logout(): void {
            // Guard against re-entry: `onUnauthorized` can fire for several in-flight
            // requests at once, and each would otherwise re-emit AUTH_LOGOUT.
            if (!token && !user && !isAuthenticated) return;

            token = null;
            user = null;
            isAuthenticated = false;

            persist();
            notify();

            eventBus.emit(EventTypes.AUTH_LOGOUT);
        },

        /** Re-reads the user from `GET /api/auth/me`; logs out if the token is no longer valid. */
        async refreshUser(): Promise<void> {
            if (!token) {
                console.warn('[AuthStore] Cannot refresh user: no token.');
                return;
            }

            try {
                user = await authService.getCurrentUser();
                isAuthenticated = true;
                persist();
                notify();
            } catch (error) {
                console.error('[AuthStore] Failed to refresh user:', error);
                store.logout();
            }
        },

        subscribe(subscriber: Subscriber): () => void {
            subscribers.add(subscriber);
            return () => {
                subscribers.delete(subscriber);
            };
        },
    };

    // Keep tabs in sync: logging out in one tab should not leave another believing it is
    // still authenticated. `storage` only fires in *other* tabs, so this cannot loop.
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', (event) => {
            // key === null means the whole store was cleared.
            if (event.key !== null && event.key !== TOKEN_KEY && event.key !== USER_KEY) return;

            token = readStoredToken();
            user = readStoredUser();
            isAuthenticated = !!token && !!user;
            notify();
        });
    }

    return store;
}

type AuthStore = ReturnType<typeof createAuthStore>;

const globalScope = globalThis as typeof globalThis & { __MICRO_MEDIC_AUTH_STORE__?: AuthStore };

/**
 * Single auth store shared by every federated bundle — deduped via `globalThis` because
 * Module Federation may still evaluate this module more than once.
 */
export const authStore: AuthStore = globalScope.__MICRO_MEDIC_AUTH_STORE__ ?? (globalScope.__MICRO_MEDIC_AUTH_STORE__ = createAuthStore());

export type { AuthStore };

export default authStore;
