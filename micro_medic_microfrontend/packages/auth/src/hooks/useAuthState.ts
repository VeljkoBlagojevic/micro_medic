import { useEffect, useState } from 'react';
import { authContext, type AuthState } from '@micro-medic/shared-store';

/**
 * React view of the shared session.
 *
 * `authContext` even here, in the MFE that writes the session: `useAuthActions` is the single commit
 * point and the only file in this package that imports `authStore`.
 *
 * Duplicated from `calendar`'s copy on purpose: an MFE-to-MFE import would couple two
 * independently deployable packages, and `shared-store` cannot own it without taking on a
 * React dependency that its Angular, Vue and custom-element consumers would then inherit. Twelve
 * lines is the right price for that — `icd10` pays it too, in `composables/useAuthState.ts`, and
 * the fact that each framework's bridge is ~12 lines is itself the argument for keeping the store
 * framework-free.
 */
export function useAuthState(): AuthState {
    const [authState, setAuthState] = useState<AuthState>(() => authContext.getState());

    useEffect(() => {
        // Re-read on mount: the store may have changed between the initial render and this
        // effect (another MFE could have logged out in that window).
        setAuthState(authContext.getState());
        return authContext.subscribe(setAuthState);
    }, []);

    return authState;
}
