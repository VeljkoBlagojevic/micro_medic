import { eventBus, EventTypes, authStore } from '@micro-medic/shared-store';
import { createIcd10App } from './ICD10.js';

// The theme has to be on the page for the Lit components to resolve their `--mm-*` tokens. The shell
// normally loads it; with no shell here, the harness does it itself. This is the *only* context in
// which this package may import the document-wide stylesheets — a federated build must never.
import '@micro-medic/design-system/src/tokens.css';
import '@micro-medic/design-system/src/global.css';

/**
 * Standalone dev harness — no shell, no Module Federation, no `examination` remote.
 *
 * It boots the application through `createIcd10App()`, the same factory `ICD10.ts` uses for the
 * federated mount, so what runs here is the real thing and not a lookalike. What the harness supplies
 * is the *other side of the split*: it subscribes to `ICD10_DISEASE_SELECTED` and prints what this
 * pane publishes. If a code appears in the log when a row is clicked, the Angular form next door will
 * receive it too — the contract is the event and nothing else, which is the property the split is
 * supposed to have. `examination`'s harness does the mirror image of this, publishing the same event
 * from stand-in buttons.
 *
 * The auth line matters more here than it looks. `GET /api/diseases/**` is `permitAll`, so this pane
 * is one of the few in the application that works fully signed out — which makes it the right place
 * to *see* that. The panel shows whether a token is present, so "the list is empty" can be told apart
 * from "the session expired", and the store's reload-on-session-change is observable.
 */

const host = document.getElementById('icd10-root');
if (!host) {
    console.error('[icd10] #icd10-root not found — check public/index.html.');
} else {
    const { app } = createIcd10App();
    app.mount(host);
}

/* ------------------------------------------------------------------ event log */

const eventEl = document.getElementById('icd10-last-event');

function logEvent(text: string): void {
    if (eventEl) eventEl.textContent = `Last event: ${text}`;
    console.info(`[icd10] ${text}`);
}

/*
 * The one event this MFE publishes. Listening to it from the harness is not redundant with clicking a
 * row: the emit goes through the shared bus singleton, so what is logged here has genuinely crossed
 * the same channel the Angular remote listens on — including the `globalThis` dedupe that makes it one
 * bus rather than one per bundle.
 */
eventBus.on(EventTypes.ICD10_DISEASE_SELECTED, ({ disease }) => {
    logEvent(`ICD10_DISEASE_SELECTED — ${disease.code} (${disease.description})`);
});

/* ------------------------------------------------------------------ auth panel */

const authEl = document.getElementById('icd10-auth');

function renderAuth(): void {
    if (!authEl) return;
    const { isAuthenticated, user, role } = authStore.getState();
    authEl.textContent = isAuthenticated
        ? `Signed in: ${user?.firstname ?? '?'} ${user?.lastname ?? ''} (${role ?? 'no role'})`
        : 'Anonymous — the catalogue is public, so the list should still load.';
}

authStore.subscribe(renderAuth);
renderAuth();

const signOutButton = document.getElementById('icd10-sign-out');
signOutButton?.addEventListener('click', () => {
    // Exercises the store's session watcher: a logout must clear the selection and reload the list,
    // because a diagnosis chosen in a session that has ended is stale advice.
    authStore.logout();
    logEvent('AUTH_LOGOUT (from harness) — selection cleared, list reloaded');
});

console.info(
    '[icd10] Standalone harness ready. A backend at http://localhost:8080 with a seeded ' +
        'disease table is required for anything beyond the empty state ' +
        '(POST /api/seeder/disease, dev profile, authenticated).'
);
