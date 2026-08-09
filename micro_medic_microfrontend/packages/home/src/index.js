import { registerApplication, start, navigateToUrl } from 'single-spa';
import { authStore, eventBus, EventTypes } from 'shared_store/store';
import { toActivityFn } from './activity';
import { routes, LOGIN_ROUTE, REGISTER_ROUTE, DEFAULT_ROUTE } from './routes';

// The shell owns the global theme, and loads it exactly once.
//
// `tokens.css` declares the `--mm-*` custom properties on `:root`; `global.css` (which imports
// it) adds the reset, document styles and layout utilities. Both are document-wide, so an MFE
// must not ship them: two remotes each applying their own reset is the classic micro-frontend
// CSS collision, and whichever loads second silently wins. Loading here also means the tokens
// exist before any remote mounts — every `mm-*` component reads them through
// `var(--mm-token, fallback)`, so a missing theme degrades to hardcoded defaults rather than
// breaking, but the fallbacks are not the brand.
import '@micro-medic/design-system/global.css';

/*
 * The shell has exactly three jobs, and this file is all of them:
 *
 *   1. load the theme (above),
 *   2. register each micro-frontend against its routes (`routes.js` + `activity.js`),
 *   3. redirect when the current route is not viewable (below).
 *
 * Everything else belongs to a remote. In particular the shell renders no UI of its own — the
 * app bar is the `nav` MFE, not a shell component, so it can be redeployed on its own.
 */

const isAuthenticated = () => authStore.getState().isAuthenticated;

const AUTH_ROUTES = [LOGIN_ROUTE, REGISTER_ROUTE];
const isAuthRoute = (pathname) => AUTH_ROUTES.some((route) => pathname.startsWith(route));

/**
 * Sends the visitor somewhere viewable.
 *
 * Two cases, and they are mirror images:
 *   - no token on a protected route → `/login`,
 *   - a token on `/login` → `/calendar`.
 *
 * The second is also handled inside the auth MFE, which is not redundant: that one covers a
 * login completing while auth is already mounted, this one covers a fresh page load with a
 * token in `localStorage`. Neither can see the other's trigger.
 *
 * `/` is normalised to a real route rather than left to match nothing, so the shell never
 * renders a blank page.
 */
function redirectIfNeeded() {
    const { pathname } = window.location;

    if (isAuthenticated()) {
        if (isAuthRoute(pathname) || pathname === '/') navigateToUrl(DEFAULT_ROUTE);
        return;
    }

    if (!isAuthRoute(pathname)) navigateToUrl(LOGIN_ROUTE);
}

routes.forEach((entry) => {
    registerApplication(entry.name, entry.load, toActivityFn(entry, isAuthenticated));
});

/*
 * `single-spa:before-routing-event` rather than `routing-event`: this fires *before* single-spa
 * decides what to mount, so a redirect is resolved in the same pass and no application mounts
 * only to be torn down again.
 */
window.addEventListener('single-spa:before-routing-event', redirectIfNeeded);

/*
 * Log out is a state change, not a navigation, so no routing event fires — without this listener
 * a logged-out user would sit on `/calendar` watching an empty screen. Subscribing to the store's
 * bus event (rather than polling) is the whole point of having one: the shell learns about a
 * logout published by *any* MFE, and needs to know about none of them.
 */
eventBus.on(EventTypes.AUTH_LOGOUT, () => redirectIfNeeded());
eventBus.on(EventTypes.AUTH_LOGIN, () => redirectIfNeeded());

// Runs once for the initial URL, since neither event has fired yet on first load.
redirectIfNeeded();

start();
