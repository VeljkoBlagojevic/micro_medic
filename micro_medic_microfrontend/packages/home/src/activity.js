/**
 * Turns a routing-table entry into a single-spa activity function.
 *
 * An activity function is called on every route change and answers one question: should this
 * application be mounted right now? single-spa handles the rest — mounting what became active,
 * unmounting what did not.
 */

/**
 * Prefix match on whole path segments.
 *
 * `pathname.startsWith(prefix)` alone is wrong: `/calendar` would also match `/calendar-archive`,
 * silently mounting the calendar on someone else's route. Requiring the next character to be `/`
 * (or nothing) is what makes the prefix a segment boundary.
 */
export function matchesRoute(pathname, prefix) {
    if (prefix === '*') return true;
    if (pathname === prefix) return true;
    return pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);
}

/**
 * Builds the activity function for one entry.
 *
 * `isAuthenticated` is passed as a callback rather than a boolean: the function is re-evaluated
 * on every route change, so it must read the *current* auth state. A boolean captured at
 * registration time would be false forever.
 *
 * The authentication check lives here, in the shell, for the same reason routing does — it is a
 * property of the composition. Note what it is *not*: this is navigation, not security. It stops
 * an unauthenticated visitor from seeing an empty calendar; it does not protect any data. The
 * backend does that, per request, in `@PreAuthorize` and `AccessGuard`, and would reject the
 * calendar's API calls regardless of what the shell chose to mount.
 */
export function toActivityFn(entry, isAuthenticated) {
    return ({ pathname }) => {
        const onRoute = entry.routes.some((route) => matchesRoute(pathname, route));
        if (!onRoute) return false;

        const excluded = (entry.exceptRoutes ?? []).some((route) => matchesRoute(pathname, route));
        if (excluded) return false;

        // A public app (auth) mounts regardless; everything else needs a token.
        return entry.public === true || isAuthenticated();
    };
}
