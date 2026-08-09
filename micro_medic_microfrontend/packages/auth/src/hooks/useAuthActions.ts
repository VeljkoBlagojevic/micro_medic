import { useCallback, useState } from 'react';
import { authService } from '@micro-medic/api-client';
import { authStore, eventBus } from '@micro-medic/shared-store';
import { EventTypes } from '@micro-medic/shared-types';
import type { AuthenticationResponseDto } from '@micro-medic/shared-types';
import { navigateToUrl } from 'single-spa';
import type { LoginFormValues, RegisterFormValues } from '../schemas.js';
import { loginErrorMessage, registerErrorMessage } from '../utils/error-message.js';

/**
 * Where to land after authenticating. The calendar is the only implemented feature, and it is
 * meaningful to both roles — a doctor manages the schedule, a patient sees their appointments.
 */
const POST_LOGIN_PATH = '/calendar';

export interface AuthActionsState {
    submitting: boolean;
    /** User-facing failure text, or null. Field-level errors stay on the form itself. */
    error: string | null;
}

/**
 * Wraps the three write operations this MFE owns. Deliberately hand-rolled rather than
 * TanStack Query: these are one-shot commands with no cache to invalidate, and pulling a
 * query client in would add a shared singleton for no benefit.
 */
export function useAuthActions() {
    const [state, setState] = useState<AuthActionsState>({ submitting: false, error: null });

    /**
     * The single place a successful credential exchange is committed.
     *
     * `authStore.login` persists the token, notifies subscribers *and* emits `AUTH_LOGIN` on
     * the bus — that one call is what every other micro-frontend reacts to, which is why this
     * package never needs to know who they are.
     */
    const complete = useCallback((response: AuthenticationResponseDto) => {
        authStore.login(response.token, response.user);

        eventBus.emit(EventTypes.NOTIFICATION_SHOW, {
            message: `Welcome, ${response.user.firstname}.`,
            type: 'success',
        });

        // Client-side routing: `navigateToUrl` pushes history and lets single-spa re-evaluate
        // every activity function, which unmounts this MFE and mounts the destination. A
        // `location.assign` would full-page reload and throw away the whole shared scope.
        navigateToUrl(POST_LOGIN_PATH);
    }, []);

    /** Runs `action`, funnelling failures into `state.error` via `toMessage`. */
    const run = useCallback(
        async (
            action: () => Promise<AuthenticationResponseDto>,
            toMessage: (error: unknown) => string
        ): Promise<boolean> => {
            setState({ submitting: true, error: null });
            try {
                complete(await action());
                // No `setState` on success: `complete` navigates, so this component is
                // unmounting and setting state here would be a no-op at best.
                return true;
            } catch (error) {
                setState({ submitting: false, error: toMessage(error) });
                return false;
            }
        },
        [complete]
    );

    const login = useCallback(
        ({ email, password }: LoginFormValues) =>
            run(() => authService.login(email, password), loginErrorMessage),
        [run]
    );

    /**
     * The one place the form's shape is translated to the wire shape.
     *
     * `confirmPassword` and `role` exist only in the UI, and `specializationId` only belongs on
     * the doctor request — so the fields are listed explicitly rather than spread. A
     * `{ ...values }` here would send `role` and `confirmPassword` to a `RegisterRequest` that
     * has neither, and Boot rejects unknown properties by default.
     */
    const register = useCallback(
        (values: RegisterFormValues) => {
            const { firstName, lastName, email, password, role, specializationId } = values;
            const base = { firstName, lastName, email, password };

            return run(
                () =>
                    role === 'DOCTOR'
                        ? authService.registerDoctor({
                              ...base,
                              // Non-null: the schema's `.refine` guarantees it for a doctor,
                              // so `handleSubmit` cannot reach here without one.
                              specializationId: specializationId!,
                          })
                        : authService.registerPatient(base),
                registerErrorMessage
            );
        },
        [run]
    );

    /** Clears a stale banner when the user switches between the login and register forms. */
    const clearError = useCallback(() => {
        setState((previous) => (previous.error === null ? previous : { ...previous, error: null }));
    }, []);

    return { ...state, login, register, clearError };
}
