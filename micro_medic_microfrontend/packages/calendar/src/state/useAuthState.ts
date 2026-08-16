import { useEffect, useState } from 'react';
import { authContext } from '@micro-medic/shared-store';
import type { AuthState } from '@micro-medic/shared-store';

/**
 * React's view of the shared session. `authContext`, not `authStore`: this MFE reads who is signed
 * in and cannot change it.
 */
export function useAuthState(): AuthState {
    const [authState, setAuthState] = useState<AuthState>(() => authContext.getState());

    useEffect(() => {
        // Re-read: another fragment may have logged out between the first render and this effect.
        setAuthState(authContext.getState());
        return authContext.subscribe(setAuthState);
    }, []);

    return authState;
}