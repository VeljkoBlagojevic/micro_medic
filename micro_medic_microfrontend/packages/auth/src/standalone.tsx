import { createRoot } from 'react-dom/client';
import { authStore, eventBus } from '@micro-medic/shared-store';
import { EventTypes } from '@micro-medic/shared-types';
import { AuthApp } from './AuthApp.js';

// Design tokens must be on the page for the Lit components to pick up the theme; the shell
// normally does this, so the standalone harness has to do it itself.
import '@micro-medic/design-system/src/tokens.css';
import '@micro-medic/design-system';

// Standalone dev harness for the auth MFE (no shell, no Module Federation).

const host = document.getElementById('auth-root');
if (host) {
    createRoot(host).render(<AuthApp />);
} else {
    console.error('[auth] #auth-root not found — check public/index.html.');
}

const stateEl = document.getElementById('auth-state');
function renderState() {
    if (!stateEl) return;
    const { isAuthenticated, user, role } = authStore.getState();
    stateEl.textContent = isAuthenticated
        ? `Authenticated as ${user?.firstname} ${user?.lastname} (${role})`
        : 'Not authenticated';
}
renderState();
authStore.subscribe(renderState);

/*
 * The bus events this MFE publishes. Watching them here is the point of the harness: a
 * successful login is only useful to the rest of the system through `AUTH_LOGIN`, so if it does
 * not appear below, no sibling MFE would have reacted either.
 */
const eventEl = document.getElementById('auth-last-event');
function logEvent(text: string) {
    if (eventEl) eventEl.textContent = `Last event: ${text}`;
    console.info(`[auth] ${text}`);
}

eventBus.on(EventTypes.AUTH_LOGIN, ({ user }) => {
    logEvent(`AUTH_LOGIN — ${user.firstname} ${user.lastname} (${user.role})`);
});
eventBus.on(EventTypes.AUTH_LOGOUT, () => logEvent('AUTH_LOGOUT'));
eventBus.on(EventTypes.NOTIFICATION_SHOW, ({ message, type }) => {
    logEvent(`NOTIFICATION_SHOW [${type}] ${message}`);
});

document.getElementById('auth-sim-logout')?.addEventListener('click', () => {
    authStore.logout();
});

/*
 * There is no shell here to route, so the harness swaps the path itself. `history.pushState`
 * plus a `popstate` — which `pushState` does not fire on its own — is what `useRoute` listens
 * for in the absence of single-spa's `single-spa:routing-event`.
 */
document.querySelectorAll<HTMLElement>('[data-auth-route]').forEach((button) => {
    button.addEventListener('click', () => {
        const path = button.dataset.authRoute;
        if (!path) return;
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    });
});
