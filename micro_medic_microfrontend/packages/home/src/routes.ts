import type { LifeCycles } from 'single-spa';

/**
 * The composition, as data.
 *
 * **Routing belongs to the shell, and only to the shell.** Composition is a property of the whole, so it
 * belongs to the one package that can see the whole. A remote that decided its own routes could not be
 * reasoned about without reading every remote, and two of them would eventually claim the same path with
 * nothing in a position to notice. That is why there is no route constant in `@micro-medic/shared-types`:
 * a shared route string would let a fragment believe it has a say.
 *
 * A table rather than a sequence of `registerApplication` calls, because it is then *readable* — the
 * whole composition is one screenful, and the difference between the two always-mounted fragments is
 * visible as a difference in data rather than buried in two similar-looking calls.
 *
 * Adding a remote is two edits in this package: the `REMOTES` map in `webpack.config.js` and an entry
 * here. Add a `<div id="single-spa-application:NAME">` to `public/index.html` as well if it should
 * render somewhere specific — single-spa appends its own div to `<body>` otherwise, which is how a
 * remote ends up outside the layout.
 */
export interface RouteEntry {
    /**
     * The single-spa application name, which is *also* the mount point: single-spa renders into
     * `#single-spa-application:<name>`. So these strings are a contract with `public/index.html`, and
     * `header`/`footer` are named for their positions rather than for the `nav` package they come from
     * — one package, two applications, because the shell mounts them in two different places.
     */
    name: string;

    /**
     * The federated import. A function, so it is called on first activation rather than at startup:
     * that laziness is what lets `public/index.html` carry no remote `<script>` tags, and it is why an
     * unreachable remote is a single rejected promise (answered by `addErrorHandler` in `index.ts`)
     * instead of a document that never renders.
     */
    load: () => Promise<LifeCycles>;

    /** Whole path segments this entry is active on. `'*'` means every route. */
    routes: readonly string[];

    /**
     * Subtracted from `routes`. The reason it exists at all: the chrome is active everywhere *except*
     * the sign-in screens, and expressing that as an exclusion keeps `'*'` honest — the alternative is
     * enumerating every route the application will ever have in two places.
     */
    exceptRoutes?: readonly string[];

    /**
     * `'full'` means this entry owns the viewport on its routes, and the shell collapses its own
     * `.mm-container` while it is active. The vertical-split case: `auth` is not a fragment *inside* a
     * composed page, it *is* the page.
     */
    layout?: 'full';

    /**
     * Mounts without a session. Everything else is gated in `activity.ts`.
     *
     * **This gate is navigation, not security.** It keeps an unauthenticated visitor off an empty
     * screen; access to data is enforced per request by the backend (`@PreAuthorize` plus
     * `AccessGuard`), which is the only place it can be enforced at all.
     */
    public?: boolean;
}

/** Where a signed-in visitor with no route of their own lands. */
export const DEFAULT_ROUTE = '/calendar';

/** Where an unauthenticated visitor is sent. Matches `auth`'s own `LOGIN_PATH`. */
export const LOGIN_ROUTE = '/login';

/**
 * The sign-in screens, which the chrome is suppressed on.
 *
 * Named once and referenced by both `nav` entries below, because "the header and the footer are hidden
 * on the same routes" is the actual rule — two independently maintained lists would let them drift into
 * a footer under a full-viewport login form.
 */
const CHROME_HIDDEN_ROUTES = [LOGIN_ROUTE, '/register'] as const;

export const ROUTES: readonly RouteEntry[] = [
    /*
     * ---- Always-mounted fragments -------------------------------------------------------------
     *
     * The three `routes: ['*']` entries, and the difference between them is the whole reason
     * `notifications` is its own micro-frontend rather than a third application inside `nav`: the bar
     * and the footer are suppressed on the sign-in screens, and the toast layer must not be — a failed
     * sign-in is precisely the case that needs a toast. Two fragments needing different route contracts
     * are two fragments.
     */
    {
        name: 'header',
        load: () => import('nav/Header'),
        routes: ['*'],
        exceptRoutes: CHROME_HIDDEN_ROUTES,
    },
    {
        name: 'footer',
        load: () => import('nav/Footer'),
        routes: ['*'],
        exceptRoutes: CHROME_HIDDEN_ROUTES,
    },
    {
        name: 'notifications',
        load: () => import('notifications/Notifications'),
        routes: ['*'],
        // No `exceptRoutes`, and `public` for the same reason: the one message this layer most needs to
        // deliver is "that sign-in failed", which happens while there is no session to authorise it.
        public: true,
    },

    /*
     * ---- Vertical split -----------------------------------------------------------------------
     *
     * `auth` owns the viewport on its two routes: `layout: 'full'`, the chrome subtracted above, and a
     * mount point outside `.mm-container` in `public/index.html`. It is also the only `public` feature
     * entry, and the only thing in the application that writes a session.
     */
    {
        name: 'auth',
        load: () => import('auth/Auth'),
        routes: [LOGIN_ROUTE, '/register'],
        layout: 'full',
        public: true,
    },

    /*
     * ---- Horizontal split ---------------------------------------------------------------------
     *
     * Two entries, one route. `/examination` composes the Angular examination form beside the Vue 3
     * ICD-10 catalogue, at 3/4 and 1/4 of the width — a ratio that lives in the shell's markup
     * (`.mm-split--primary`), because a fragment cannot see the screen it shares and so cannot claim a
     * share of it. They talk only over the event bus (`ICD10_DISEASE_SELECTED`); neither imports the
     * other, and neither *can*, which is what makes "the composition boundary is the browser"
     * falsifiable rather than merely asserted.
     *
     * Order here does not decide the layout — `public/index.html` does, `examination` first — but
     * keeping the two adjacent is what makes the pair visible as a pair.
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

    /* ---- Ordinary feature route -------------------------------------------------------------- */
    {
        name: 'calendar',
        load: () => import('calendar/Calendar'),
        routes: [DEFAULT_ROUTE],
    },
];
