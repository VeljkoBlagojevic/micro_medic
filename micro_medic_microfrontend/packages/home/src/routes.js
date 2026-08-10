/**
 * The shell's routing table — the one place that decides which micro-frontend is mounted where.
 *
 * This is deliberately data, not code, and deliberately in the shell rather than in the remotes.
 * The composition of the application is the shell's single responsibility: a remote that decided
 * for itself when to mount could not be reasoned about without reading every remote, and two of
 * them would eventually claim the same route.
 *
 * Each entry is `{ name, load, routes, exceptRoutes?, layout?, public? }`:
 *
 *  - `routes`        path prefixes the app is active on. `'*'` means every route.
 *  - `exceptRoutes`  prefixes to subtract from `routes` — how the chrome stays off the auth screen.
 *  - `public`        mounts without a token. Only `auth` is public; everything else needs one.
 *  - `layout`        `'full'` opts out of the shell's container so the app owns the viewport.
 */

/** Routes owned by the auth MFE. Named because the guard below redirects *to* the first of them. */
export const LOGIN_ROUTE = '/login';
export const REGISTER_ROUTE = '/register';

/** Where an authenticated visitor with no route goes. */
export const DEFAULT_ROUTE = '/calendar';

/** The auth screen is full-bleed, so the shell's own chrome stays out of its way. */
const CHROME_EXCEPT = [LOGIN_ROUTE, REGISTER_ROUTE];

export const routes = [
    {
        name: 'auth',
        load: () => import('auth/Auth'),
        routes: [LOGIN_ROUTE, REGISTER_ROUTE],
        // The only app that must mount without a token — it is how one is obtained.
        public: true,
        // Vertical split: auth owns the whole viewport, app bar included, so it is mounted
        // outside `.mm-container`.
        layout: 'full',
    },
    /*
     * The chrome. `public` because it frames every screen, signed in or not — it must not
     * unmount and remount around the login redirect, which is what gating it on a token would
     * cause. It renders navigation, not data.
     */
    {
        name: 'header',
        load: () => import('nav/Header'),
        routes: ['*'],
        exceptRoutes: CHROME_EXCEPT,
        public: true,
    },
    /*
     * The notification layer — and the one entry in this table with `routes: ['*']` and *no*
     * `exceptRoutes`.
     *
     * That is the whole reason it is a micro-frontend of its own rather than a third application
     * inside `nav`. The chrome is switched off on `/login` and `/register`, while a failed sign-in is
     * exactly the case that most needs a toast; a fragment whose activity function differs from the
     * chrome's is not part of the chrome. `public` for the same reason as the header, and more so:
     * the messages it shows include the ones about not being signed in.
     */
    {
        name: 'notifications',
        load: () => import('notifications/Notifications'),
        routes: ['*'],
        public: true,
    },
    {
        name: 'calendar',
        load: () => import('calendar/Calendar'),
        routes: ['/calendar'],
    },
    /*
     * `examination` and `icd10` share `/examination`: the examination form across three quarters of
     * the screen, the ICD-10 disease catalogue in the remaining quarter. That is a **horizontal
     * split** — two independently deployed MFEs composed side by side on a single screen,
     * communicating only through the event bus (`ICD10_DISEASE_SELECTED`). Neither imports the
     * other, and either can be redeployed without the other noticing.
     *
     * They are also written in different frameworks — `examination` is Angular with signals and no
     * `zone.js`, `icd10` is Vue 3 with the Composition API — which is the sharpest demonstration in
     * the repo that the composition boundary is the *browser*, not a build step. Two frameworks that
     * cannot import each other's components, on one screen, agreeing on one custom event.
     *
     * The 3:1 geometry is not here. This table decides *whether* a fragment is mounted; where it
     * lands is `.mm-split--primary` around the two mount points in `public/index.html`.
     */
    {
        name: 'examination',
        load: () => import('examination/Examination'),
        routes: ['/examination'],
    },
    {
        name: 'icd10',
        load: () => import('icd10/ICD10'),
        routes: ['/examination'],
    },
    {
        name: 'footer',
        load: () => import('nav/Footer'),
        routes: ['*'],
        exceptRoutes: CHROME_EXCEPT,
        public: true,
    },
];
