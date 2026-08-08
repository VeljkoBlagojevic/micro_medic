import { useEffect, useState } from 'react';
import { authStore } from '@micro-medic/shared-store';
import type { AuthState } from '@micro-medic/shared-store';

export function useAuthState(): AuthState {
    const [authState, setAuthState] = useState<AuthState>(() => authStore.getState());

    useEffect(() => {
        setAuthState(authStore.getState());
        return authStore.subscribe(setAuthState);
    }, []);

    return authState;
}