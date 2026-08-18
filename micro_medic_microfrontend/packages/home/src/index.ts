import { addErrorHandler, navigateToUrl, registerApplication, start } from 'single-spa';
import { authContext, authStore, eventBus, EventTypes } from '@micro-medic/shared-store';
import { NAV_SIGN_OUT_EVENT } from '@micro-medic/shared-types';
import { createActivityFn, isUnauthenticatedPath } from './activity.js';
import { DEFAULT_ROUTE, LOGIN_ROUTE, ROUTES, type RouteEntry } from './routes.js';

/*
 * The document-wide theme, loaded **here and nowhere else**.
 *
 * `tokens.css` publishes the `--mm-*` custom properties (including the shared z-index scale, which is
 * shared precisely so two independently deployed remotes cannot invent colliding values and land one
 * team's modal behind another's sticky header); `global.css` imports it, then the reset and the layout
 * utilities the shell composes with. Both are document-level by nature, so a remote importing either
 * would be the classic micro-frontend collision — two resets, and whichever loads second silently wins.
 *
 * Custom properties pierce shadow DOM, which is what lets one stylesheet loaded by the shell reach
 * every Lit component in every remote. Nothing else can: a global `.mm-btn` rule is unreachable by
 * construction.
 */
import '@micro-medic/design-system/src/tokens.css';
import '@micro-medic/design-system/src/global.css';

/**
 * The shell. It renders no UI of its own — the whole package is this file, a route table and an activity
 * function — and does exactly four things: register the applications, load the theme, redirect, and
 * carry the two halves of parent/fragment communication.
 */

/**
 * Read through `authContext`, not `authStore`: the shell has no business writing session state beyond
 * the one `logout()` below, and `authContext` is a frozen delegate with no `login`/`logout` **on the
 * value** rather than merely hidden by its type.
 */
const isAuthenticated = (): boolean => authContext.getState().isAuthenticated;

/**
 * Registered entries, paired with their activity functions.
 *
 * Kept because the layout decision below asks the same question single-spa does — "is this entry active
 * right now?" — and asking it with the same predicate is what stops the container from being hidden on a
 * route where `auth` is not actually mounted.
 */
const registered: Array<{ entry: RouteEntry; isActive: (location: Location) => boolean }> = ROUTES.map(
    (entry) => {
        const isActive = createActivityFn(entry, isAuthenticated);

        registerApplication({
            name: entry.name,
            app: entry.load,
            activeWhen: isActive,
            /*
             * Parent → fragment, offered **uniformly** (Geers §6.1.1).
             *
             * Every application gets the same `session`, whether or not it wants one. A shell that knew
             * which fragment needed what would be the participant that has to be redeployed whenever a
             * fragment's appetite changes — which is the coupling the architecture exists to avoid. Today
             * only `nav` consumes it, through `createCustomElementLifecycles`, which projects it onto
             * `<nav-app-bar>` as attributes.
             */
            customProps: { session: authContext },
        });

        return { entry, isActive };
    }
);

/**
 * A failed remote is contained to its own mount point.
 *
 * Every `load` is a dynamic `import()` of a federated container, so an unreachable remote is a rejected
 * promise — which single-spa routes here and then marks the application broken. Rendering the failure
 * *in that remote's own div* is the point: the rest of the page keeps working, and the gap says what is
 * missing instead of being blank. Under the old scheme, when `public/index.html` fetched all seven
 * containers with blocking `<script>` tags, the same condition took the whole document down before any
 * handler existed to report it.
 *
 * Plain markup, not `mm-error-state`: rendering an `mm-*` tag would make the shell a consumer of the
 * design system's *components*, which would in turn have to be declared a federation singleton here —
 * a dependency taken on for an error path. The shell loads the theme and composes; it does not render.
 */
addErrorHandler((error) => {
    const name = error.appOrParcelName;
    console.error(`[shell] Micro-frontend "${name}" failed and was contained:`, error);

    const container = document.getElementById(`single-spa-application:${name}`);
    if (!container) return;

    const heading = document.createElement('p');
    heading.className = 'mm-muted';
    // `textContent`, so nothing from an error message is ever parsed as markup.
    heading.textContent = `The "${name}" section could not be loaded. The rest of the page still works.`;

    container.replaceChildren(heading);
});

/**
 * Where the visitor should be, or `null` if they are already somewhere valid.
 *
 * Three rules, and the order matters only for `/`: an unauthenticated visitor there is caught by the
 * first rule anyway, so the last rule only ever fires for a signed-in one.
 */
function resolveRedirect(pathname: string): string | null {
    const authenticated = isAuthenticated();

    // No session on a screen that needs one. Without this the visitor gets a page with chrome and
    // nothing in it, which reads as a broken application rather than as a closed door.
    if (!authenticated && !isUnauthenticatedPath(pathname)) return LOGIN_ROUTE;

    // Signed in, but on the sign-in screen — most often having just signed in, or after a Back press.
    if (authenticated && isUnauthenticatedPath(pathname)) return DEFAULT_ROUTE;

    // The bare root, which no entry claims.
    if (pathname === '/' || pathname === '') return DEFAULT_ROUTE;

    return null;
}

/**
 * `navigateToUrl`, never `location.assign`: a full page load would throw away the Module Federation
 * shared scope and re-download every container. This pushes history and lets single-spa re-evaluate
 * every activity function, which is the whole mechanism.
 */
function applyRedirect(): void {
    const target = resolveRedirect(window.location.pathname);
    if (target === null || target === window.location.pathname) return;
    navigateToUrl(target);
}

/**
 * Collapses the shell's own container while a `layout: 'full'` entry is active.
 *
 * The `hidden` attribute rather than a class, because the shell has no stylesheet of its own and
 * inventing a selector in the design system for one consumer would put a shell-local layout decision in
 * a package four frameworks share.
 */
const pageContainer = document.querySelector<HTMLElement>('.mm-container');

/** DEBUG: Log when evaluating activities */
function applyLayout(): void {
    if (!pageContainer) return;

    pageContainer.hidden = registered.some(({ entry, isActive }) => entry.layout === 'full' && isActive(window.location));
}

/*
 * `before-routing-event`, not `routing-event`.
 *
 * A redirect issued *before* the reroute resolves in the same pass, so nothing mounts only to be torn
 * down a moment later — which is not merely wasteful: a fragment that mounts, fetches and unmounts leaves
 * a request in flight whose response arrives for a component that is gone.
 */
window.addEventListener('single-spa:before-routing-event', () => {
    applyRedirect();
    applyLayout();
});

/*
 * A sign-in or sign-out is a **state** change, and it fires no routing event — so without these two the
 * visitor would stay on the login screen after signing in until they navigated by hand. `auth` calls
 * `navigateToUrl` itself on a successful login, which makes this the safety net rather than the primary
 * path; for a logout it *is* the primary path.
 */
eventBus.on(EventTypes.AUTH_LOGIN, () => {
    applyRedirect();
    applyLayout();
});
eventBus.on(EventTypes.AUTH_LOGOUT, () => {
    applyRedirect();
    applyLayout();
});

/*
 * Fragment → parent (Geers §6.1.2), and the shell's **only** write to session state.
 *
 * `nav` dispatches a bubbling, composed `nav:sign-out` and holds no write capability of its own: the
 * session reaches it as three attributes, so the button in the app bar asks its host to sign out rather
 * than doing it. The event name is a string contract with a package the shell shares no other code with,
 * which is exactly why it is a constant in `shared-types` — a disagreement over the spelling is a button
 * that stops working, with nothing logged anywhere.
 */
window.addEventListener(NAV_SIGN_OUT_EVENT, () => {
    authStore.logout();
});

// Before `start()`, so the first reroute already has the visitor on a route they may be on. Redirecting
// afterwards would mount a screen and immediately tear it down.
applyRedirect();
applyLayout();

start();
