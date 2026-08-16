import type { Role, UserDto } from '@micro-medic/shared-types';
import { EventTypes } from '@micro-medic/shared-types';
import { configureApiClient } from '@micro-medic/api-client';
import { eventBus } from './event-bus';
import { openSessionChannel, type SessionChannel } from './session-channel';

/** Exported because `AuthContext` names it in a public signature. */
export type Subscriber = (state: AuthState) => void;

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

    // Opened at the bottom of this factory, once `store` exists. Null in a non-DOM context, which is
    // why every publish below is optional rather than assumed.
    let sessionChannel: SessionChannel | null = null;

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

            // The user, not the token: a subscriber needing an authenticated request goes through
            // `api-client`, which reads the token from this store.
            eventBus.emit(EventTypes.AUTH_LOGIN, { user: newUser });

            // The bus reaches this document; the channel reaches the other tabs.
            sessionChannel?.publish({ type: 'signed-in' });
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

            // The re-entry guard above is what keeps this to one message per real sign-out, however
            // many in-flight requests the 401 interceptor answers.
            sessionChannel?.publish({ type: 'signed-out' });
        },

        subscribe(subscriber: Subscriber): () => void {
            subscribers.add(subscriber);
            return () => {
                subscribers.delete(subscriber);
            };
        },
    };

    /*
     * There was an uncalled `refreshUser()` here — `GET /api/auth/me`, then `logout()` on failure. A
     * store method that revalidates on demand invites a caller to treat a successful refresh as
     * authorization; session validity is decided per request by the backend. `authService.getCurrentUser`
     * stays, since `api-client` mirrors the controller regardless of who consumes it.
     */

    /**
     * Adopts a session decided somewhere outside this tab.
     *
     * **The bus emit is the part that was missing**, and it is why a doctor could sign out in one tab
     * and leave a patient's name, diagnosis and anamnesis on screen in the next. Three consumers listen
     * to the bus rather than to this store — the shell (redirect), `notifications` (clear the stack,
     * since a toast may name a patient) and `examination` (`reset()` the draft) — so the previous
     * handler, which only called `notify()`, skipped all three. `nav` re-rendered to a signed-out bar,
     * which made it look handled: the app bar said "Sign in" above a form full of patient data.
     *
     * Guarded on an actual change, which is what makes two observers safe: the channel and `storage`
     * both fire for the same sign-out and the second to arrive returns here. The guard compares the
     * token rather than `isAuthenticated`, so a token replaced for the same user still reports — that
     * is a new session.
     */
    function applyExternalSession(nextToken: string | null, nextUser: UserDto | null): void {
        const nextIsAuthenticated = !!nextToken && !!nextUser;
        if (nextToken === token && nextIsAuthenticated === isAuthenticated) return;

        token = nextToken;
        user = nextUser;
        isAuthenticated = nextIsAuthenticated;

        notify();

        if (nextIsAuthenticated && nextUser) eventBus.emit(EventTypes.AUTH_LOGIN, { user: nextUser });
        else eventBus.emit(EventTypes.AUTH_LOGOUT);
    }

    if (typeof window !== 'undefined') {
        /*
         * The channel says which of the two happened, and that is the whole reason it is worth having:
         * a `signed-out` message clears this tab **without consulting storage**, so it is still correct
         * when the other tab could not remove the keys (`persist()` warns and carries on) or when
         * storage throws here. `storage` cannot express that — see the handler below.
         */
        sessionChannel = openSessionChannel((message) => {
            if (message.type === 'signed-out') applyExternalSession(null, null);
            else applyExternalSession(readStoredToken(), readStoredUser());
        });

        /*
         * Kept alongside the channel, not as a `typeof BroadcastChannel` fallback: `storage` observes
         * the medium, so it is the only one of the two that notices these keys being written by code
         * that never called this store.
         *
         * Note what it has to do that the channel does not — infer the meaning by reading the result.
         * "The keys are empty" is as close as it can get to "signed out", which is exactly Geers's
         * point about `storage` carrying no semantics.
         */
        window.addEventListener('storage', (event) => {
            // key === null means the whole store was cleared.
            if (event.key !== null && event.key !== TOKEN_KEY && event.key !== USER_KEY) return;
            applyExternalSession(readStoredToken(), readStoredUser());
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

/**
 * The read-only half of the auth surface — the composition's shared context: who is signed in, and a
 * way to hear when that changes.
 *
 * Session state has one writer (the `auth` MFE, plus `api-client`'s `onUnauthorized`); a second
 * fragment deciding it is logged in would be two remotes disagreeing about who the patient in front of
 * the doctor is. Handing out the full store made that a matter of discipline — this is a frozen object
 * with no `login`/`logout` *on the value*, so it is a matter of reach. `nav` and `auth` still import
 * `authStore`, for sign-out and sign-in respectively; everyone else reads.
 */
export interface AuthContext {
    /** A snapshot. Never mutate it; the store hands out a fresh object each call. */
    getState(): AuthState;
    /** Returns its own unsubscribe, which is the whole teardown. */
    subscribe(subscriber: Subscriber): () => void;
}

export const authContext: AuthContext = Object.freeze({
    getState: () => authStore.getState(),
    subscribe: (subscriber: Subscriber) => authStore.subscribe(subscriber),
});

export default authStore;
