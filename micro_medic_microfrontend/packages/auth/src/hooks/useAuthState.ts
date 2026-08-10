import { useEffect, useState } from 'react';
import { authStore, type AuthState } from '@micro-medic/shared-store';

/**
 * React view of the imperative auth store.
 *
 * Duplicated from `calendar`'s copy on purpose: an MFE-to-MFE import would couple two
 * independently deployable packages, and `shared-store` cannot own it without taking on a
 * React dependency that its Angular, Vue and custom-element consumers would then inherit. Twelve
 * lines is the right price for that — `icd10` pays it too, in `composables/useAuthState.ts`, and
 * the fact that each framework's bridge is ~12 lines is itself the argument for keeping the store
 * framework-free.
 */
export function useAuthState(): AuthState {
    const [authState, setAuthState] = useState<AuthState>(() => authStore.getState());

    useEffect(() => {
        // Re-read on mount: the store may have changed between the initial render and this
        // effect (another MFE could have logged out in that window).
        setAuthState(authStore.getState());
        return authStore.subscribe(setAuthState);
    }, []);

    return authState;
}
