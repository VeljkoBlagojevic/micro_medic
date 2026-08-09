import { Role } from '@micro-medic/shared-types';

/**
 * The navigation table: which links the bar offers, and to whom.
 *
 * This is *not* a second copy of the shell's routing table, and the distinction is worth being
 * precise about because it looks like duplication. The shell's `routes.js` decides **what mounts**
 * on a path. This decides **what is worth offering** to the person looking at the bar. They are
 * different questions with different answers — `/login` is a route but never a nav link, and a
 * patient has no reason to be offered the examination screen even though the route exists.
 *
 * Where they *do* overlap is the path strings, and that coupling is real but unavoidable: a link
 * has to point somewhere. It is also the cheap direction of coupling — a stale path here produces
 * a link the shell redirects away from, not a broken screen. What keeps it honest is that `roles`
 * is a *hint* and not a gate: the backend authorises every request in `@PreAuthorize`/`AccessGuard`
 * regardless of what this file says, so the worst a wrong entry here can do is offer a screen that
 * then comes back empty.
 */
export interface NavLink {
    href: string;
    label: string;
    /**
     * Roles the link is shown to. `undefined` means everyone signed in.
     *
     * Presentation only — see the note above. Never treat this as authorisation.
     */
    roles?: readonly Role[];
}

export const NAV_LINKS: readonly NavLink[] = [
    // Both participants in an appointment need the calendar, so no role restriction.
    { href: '/calendar', label: 'Calendar' },
    /*
     * Examination is a clinician's screen: `POST /api/examinations/**` requires `ROLE_DOCTOR`, so
     * offering it to a patient would be offering a screen whose primary action always 403s.
     * Admins are included because they can see everything and it is useful for support.
     */
    { href: '/examination', label: 'Examination', roles: [Role.DOCTOR, Role.NURSE, Role.ADMIN] },
];

/** Where the brand in the top-left points. Matches the shell's `DEFAULT_ROUTE`. */
export const HOME_HREF = '/calendar';

/** Where an unauthenticated visitor is sent. Matches the shell's `LOGIN_ROUTE`. */
export const LOGIN_HREF = '/login';

/**
 * The id of the shell's `<main>` landmark, which the bar's "skip to content" link targets.
 *
 * A contract between two packages, so it is named rather than typed twice: the shell owns the
 * landmark (it owns the composition, so it is the only thing that knows where "content" begins)
 * and nav owns the link into it. If this and `home/public/index.html` disagree, the skip link
 * silently does nothing — the failure is invisible to anyone not using a keyboard, which is
 * exactly why it is worth pinning down here.
 */
export const MAIN_LANDMARK_ID = 'mm-main';

/** The links visible to `role`, which may be `null` for a signed-in user with no role claim. */
export function visibleLinks(role: Role | null): readonly NavLink[] {
    return NAV_LINKS.filter((link) => !link.roles || (role !== null && link.roles.includes(role)));
}

/**
 * Whether `pathname` is "inside" `href`, for the purpose of marking a link current.
 *
 * Matches on whole path segments, the same rule the shell's `activity.js` uses: a bare
 * `startsWith` would mark `/calendar` as the current page while the user is on
 * `/calendar-archive`. Keeping the two consistent matters — the highlighted link claiming one
 * thing while the shell mounts another is a confusing class of bug.
 */
export function isCurrent(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
}
