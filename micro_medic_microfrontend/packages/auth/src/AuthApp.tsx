import { useEffect } from 'react';
import { MmCard } from '@micro-medic/design-system-react';
import { navigateToUrl } from 'single-spa';
import { LoginForm, RegisterForm } from './components/index.js';
import { useAuthActions } from './hooks/useAuthActions.js';
import { useAuthState } from './hooks/useAuthState.js';
import { useRoute } from './hooks/useRoute.js';

import './styles.css';

/** The two routes this micro-frontend owns outright. */
const LOGIN_PATH = '/login';
const REGISTER_PATH = '/register';

/** Where an already-authenticated visitor is sent instead of seeing a login form again. */
const AUTHENTICATED_PATH = '/calendar';

export function AuthApp() {
    const pathname = useRoute();
    const { isAuthenticated } = useAuthState();
    const { submitting, error, login, register, clearError } = useAuthActions();

    const mode = pathname.startsWith(REGISTER_PATH) ? 'register' : 'login';

    // A stale "Incorrect email or password" must not follow the user to the register form.
    useEffect(() => clearError(), [mode, clearError]);

    /*
     * Guard, not a router: the shell already refuses to mount this MFE on a protected route, but
     * the reverse case belongs here — someone with a valid token who navigates to `/login`
     * directly. Redirecting in an effect rather than during render because navigation is a side
     * effect; doing it inline would mutate history while React is rendering.
     */
    useEffect(() => {
        if (isAuthenticated) navigateToUrl(AUTHENTICATED_PATH);
    }, [isAuthenticated]);

    if (isAuthenticated) return null;

    const isRegister = mode === 'register';

    return (
        /*
         * The vertical split: this MFE owns the *entire* viewport for `/login` and `/register`,
         * brand panel included. Splitting the panel out into a second micro-frontend would be
         * the anti-pattern — two deployables that can never be released independently, because
         * neither half is usable alone.
         */
        <div className="auth-root">
            <section className="auth-brand" aria-hidden="true">
                <p className="auth-brand__mark">MicroMedic</p>
                <p className="auth-brand__tagline">
                    Appointments, examinations and diagnoses in one place.
                </p>
            </section>

            <main className="auth-panel">
                <MmCard className="auth-card" heading={isRegister ? 'Create an account' : 'Sign in'}>
                    <p className="auth-card__lede">
                        {isRegister
                            ? 'Register as a patient, or as a doctor with a specialization.'
                            : 'Use the email and password for your MicroMedic account.'}
                    </p>

                    {/*
                      `role="alert"` so a screen reader announces the failure — the message
                      appears without any focus change, and would otherwise go unnoticed.
                    */}
                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    {isRegister ? (
                        <RegisterForm submitting={submitting} onSubmit={register} />
                    ) : (
                        <LoginForm submitting={submitting} onSubmit={login} />
                    )}

                    <p className="auth-switch">
                        {isRegister ? 'Already have an account? ' : 'No account yet? '}
                        {/*
                          A real `<a href>`, intercepted by `navigateToUrl`. single-spa's handler
                          calls `preventDefault` and pushes history, so the shell re-evaluates its
                          activity functions instead of reloading the page — but the link is still
                          a link: middle-click, "open in new tab" and the status bar all work.
                        */}
                        <a
                            className="auth-switch__link"
                            href={isRegister ? LOGIN_PATH : REGISTER_PATH}
                            onClick={navigateToUrl}
                        >
                            {isRegister ? 'Sign in' : 'Create one'}
                        </a>
                    </p>
                </MmCard>
            </main>
        </div>
    );
}
