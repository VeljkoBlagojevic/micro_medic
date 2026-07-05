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

function createAuthStore() {
    let token: string | null = localStorage.getItem(TOKEN_KEY);
    let user: UserDto | null = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    let role: Role | null = user ? user.role : null;
    let isAuthenticated: boolean = !!token && !!user;
    const subscribers: Set<Subscriber> = new Set<Subscriber>();

    configureApiClient({
        getAuthToken: () => token,
        onUnauthorized: () => store.logout(),
    });

    function getState(): AuthState {
        return { token, user, role, isAuthenticated };
    }

    function notify(): void {
        const snapshot = getState();
        subscribers.forEach((subscriber) => {
            try {
                subscriber(snapshot);
            } catch (error) {
                console.error('[AuthStoreError] Error in subscriber callback:', error);
            }
        });
    }

    const store = {
        getToken(): string | null {
            return token;
        },

        getUser(): UserDto | null {
            return user;
        },

        getRole(): Role | null {
            return role;
        },

        isAuthenticated(): boolean {
            return isAuthenticated;
        },

        getState,

        login(newToken: string, newUser: UserDto): void {
            token = newToken;
            user = newUser;
            role = newUser.role;
            isAuthenticated = true;

            localStorage.setItem(TOKEN_KEY, newToken);
            localStorage.setItem(USER_KEY, JSON.stringify(newUser));

            notify();

            eventBus.emit(EventTypes.AUTH_LOGIN, { token: newToken, user: newUser });
        },

        logout(): void {
            token = null;
            user = null;
            role = null;
            isAuthenticated = false;

            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);

            notify();

            eventBus.emit(EventTypes.AUTH_LOGOUT);
        },

        async refreshUser(): Promise<void> {
            if (!token) {
                console.warn('[AuthStoreWarning] Cannot refresh user: no existing token found.');
                return;
            }

            try {
                user = await authService.getCurrentUser();
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                notify();
            } catch (error) {
                console.error('[AuthStoreError] Error while refreshing user:', error);
                store.logout();
            }
        },

        subscribe(subscriber: Subscriber): () => void {
            subscribers.add(subscriber);
            return () => {
                subscribers.delete(subscriber);
            };
        },

    }

    return store;

}

type AuthStore = ReturnType<typeof createAuthStore>;

const globalScope = globalThis as typeof globalThis & { __MICRO_MEDIC_AUTH_STORE__?: AuthStore };

export const authStore: AuthStore = globalScope.__MICRO_MEDIC_AUTH_STORE__ ?? (globalScope.__MICRO_MEDIC_AUTH_STORE__ = createAuthStore());

export default authStore;