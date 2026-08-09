import { useEffect, useState } from 'react';

/**
 * The current `location.pathname`, kept in sync with client-side navigation.
 *
 * This MFE is vertically split — it owns `/login` and `/register` outright — so it needs to
 * know which of the two is showing without pulling in a router. A router would be the wrong
 * tool anyway: the shell already routes at the application level via single-spa activity
 * functions, and a second history-owning router inside a remote is a classic way to end up
 * with two libraries fighting over `popstate`.
 *
 * single-spa fires `single-spa:routing-event` after every navigation it processes, including
 * `pushState` calls made through `navigateToUrl`. `popstate` alone would miss those, since
 * `pushState` does not emit it.
 */
export function useRoute(): string {
    const [pathname, setPathname] = useState(() => window.location.pathname);

    useEffect(() => {
        const sync = () => setPathname(window.location.pathname);

        // Re-read once on mount: a navigation may have landed between the initial
        // `useState` and this effect running.
        sync();

        window.addEventListener('single-spa:routing-event', sync);
        window.addEventListener('popstate', sync);
        return () => {
            window.removeEventListener('single-spa:routing-event', sync);
            window.removeEventListener('popstate', sync);
        };
    }, []);

    return pathname;
}
