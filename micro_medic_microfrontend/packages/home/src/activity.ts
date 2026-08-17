import { ROUTES, type RouteEntry } from './routes.js';

/**
 * Turns a `RouteEntry` into the predicate single-spa calls on every reroute.
 *
 * Two things in here are easy to get wrong, and both fail *silently*, which is why they are a module of
 * their own rather than three lines inside `index.ts`.
 */

/**
 * Whole-segment matching.
 *
 * A bare `pathname.startsWith(route)` would make `/calendar` also match `/calendar-archive`, and
 * `/log` match `/login` — so an application would mount on a route that merely shares a prefix with its
 * own, on a page it knows nothing about. `nav`'s `isCurrent` matches the same way for the same reason;
 * keeping the two consistent is what stops the highlighted link from claiming one page while another is
 * mounted.
 */
export function matchesRoute(pathname: string, route: string): boolean {
    if (route === '*') return true;

    // A trailing slash in the table would otherwise make the route match nothing at all: `/calendar/`
    // is neither equal to `/calendar` nor a prefix of `/calendar/` + '/'.
    const normalized = route.length > 1 && route.endsWith('/') ? route.slice(0, -1) : route;

    return pathname === normalized || pathname.startsWith(`${normalized}/`);
}

/**
 * The activity function for one entry.
 *
 * `isAuthenticated` is a **callback**, not a boolean, and that is the load-bearing detail. single-spa
 * re-evaluates this function on every route change and every reroute, but it builds it exactly once — so
 * a captured boolean would be whatever the session was at startup, for the lifetime of the document.
 * Signing in would then mount nothing, because every gated entry would still be reading `false`.
 *
 * The gate itself is **navigation, not security**: it keeps a visitor with no session off a screen that
 * could only render empty. Access to data is enforced per request by the backend.
 */
export function createActivityFn(
    entry: RouteEntry,
    isAuthenticated: () => boolean
): (location: Location) => boolean {
    return (location: Location): boolean => {
        const { pathname } = location;

        if (!entry.routes.some((route) => matchesRoute(pathname, route))) return false;

        // Subtraction after the match, so `exceptRoutes` can carve holes out of `'*'`.
        if (entry.exceptRoutes?.some((route) => matchesRoute(pathname, route))) return false;

        return entry.public === true || isAuthenticated();
    };
}

/**
 * The paths a visitor may legitimately be on with no session.
 *
 * Derived from the table rather than listed a second time — a hand-maintained copy is how a new public
 * route ends up redirecting to the login screen it *is*.
 *
 * `'*'` is deliberately excluded, because `public` answers two different questions and only one of them
 * is about paths. On an entry it means "mount this without a token", which is true of the toast layer on
 * *every* route; it does not mean every route is reachable without signing in. Taking the wildcard
 * literally here would make the whole application public and the redirect below dead code.
 */
const UNAUTHENTICATED_PATHS: readonly string[] = ROUTES.filter((entry) => entry.public === true)
    .flatMap((entry) => [...entry.routes])
    .filter((route) => route !== '*');

/** Whether `pathname` is one of the routes a signed-out visitor is allowed to stay on. */
export function isUnauthenticatedPath(pathname: string): boolean {
    return UNAUTHENTICATED_PATHS.some((route) => matchesRoute(pathname, route));
}
