import type { AttributeMap, AttributeProjector, AttributeSource, CustomElementMountProps } from '@micro-medic/design-system';
import type { Role, UserDto } from '@micro-medic/shared-types';

/**
 * The parent-to-fragment projection for `<nav-app-bar>` — Geers §6.1.1.
 *
 * The shell registers every application with `customProps: { session: authContext }`, uniformly, and
 * this file is the only thing in the package that knows a host might pass one. It flattens that context
 * into three attributes and hands the adapter an `AttributeSource`; the element itself remains a pure
 * function of its own attributes, which is what lets a plain HTML page with no bundler mount it.
 *
 * **It owns both ends of the naming.** `nav-app-bar.observedAttributes` imports the same three
 * constants, because a writer that spells `user-name` while the observer expects `userName` produces no
 * error anywhere — the bar simply renders signed-out forever. One definition is the only way that
 * disagreement becomes impossible rather than merely unlikely.
 *
 * **And it deliberately does not import `@micro-medic/shared-store`.** The session is narrowed
 * structurally below. That is the whole independence claim: the most-visible fragment in the
 * application is bound to a *shape*, not to a module identity, so it cannot be broken by which
 * federated copy of the store webpack happened to evaluate.
 */

/**
 * A boolean attribute, present or absent — never `"false"`, which is a non-empty string and reads as
 * signed **in** to `hasAttribute`. The element's getter is `hasAttribute`, so `''` is the only correct
 * "true" value here.
 */
export const ATTR_AUTHENTICATED = 'authenticated';

/** The display name, already joined. */
export const ATTR_USER_NAME = 'user-name';

/**
 * `user-role`, not `role`: `HTMLElement.role` is the ARIA reflection and the host carries
 * `role="banner"`. Naming this one `role` would have the projection quietly overwrite the landmark.
 */
export const ATTR_USER_ROLE = 'user-role';

/**
 * What this fragment needs to know about the session, and nothing more.
 *
 * A structural subset of the store's `AuthState` — no `token`, because the bar never makes a request:
 * every link it renders is a plain navigation, and a credential passed to a fragment that has no use
 * for one is a credential in one more place. The harness declares its own value of this type, which is
 * what lets it play host without a store.
 */
export interface SessionSnapshot {
    isAuthenticated: boolean;
    user: UserDto | null;
    role: Role | null;
}

/**
 * The context object the shell passes as `customProps.session`.
 *
 * Declared here structurally rather than imported as `AuthContext`: what the bar depends on is that
 * something can be read now and subscribed to for later, and `shared-store`'s frozen `authContext`
 * satisfies it incidentally. `getState()` returns a *superset* of `SessionSnapshot` in the real
 * application, which is fine — the projection reads three fields and ignores the rest.
 */
interface SessionContext {
    getState(): SessionSnapshot;
    subscribe(onChange: () => void): () => void;
}

/** Structural narrowing of `customProps`, which the adapter types `unknown` because it cannot know. */
function isSessionContext(value: unknown): value is SessionContext {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Partial<SessionContext>;
    return typeof candidate.getState === 'function' && typeof candidate.subscribe === 'function';
}

/**
 * Flattens a session to the three attributes.
 *
 * Scalars, deliberately. Passing `authContext` itself down as a property would deliver the same object
 * one hop later and decouple nothing — the fragment would still be bound to the store's shape and its
 * module identity. Flattening is what makes the coupling three strings wide, and it is also the honest
 * limit of the technique: this is where the pattern stops in this repo, because `nav` is the only
 * fragment whose whole input reduces to scalars.
 *
 * Every value is emitted on every projection, `null` included, so `applyAttributes` *removes* an
 * attribute that no longer applies. Omitting the key instead would leave the previous sign-in's name
 * on the element after a sign-out — the classic bug of a partial diff.
 */
export function toAttributes(session: SessionSnapshot): AttributeMap {
    // Guarded on the user as well as the flag: `isAuthenticated` with no user is a state the store
    // never produces, and rendering "Signed in" over a missing name is better than asserting one.
    const authenticated = session.isAuthenticated && !!session.user;
    const name = session.user ? `${session.user.firstname} ${session.user.lastname}`.trim() : '';

    return {
        [ATTR_AUTHENTICATED]: authenticated ? '' : null,
        [ATTR_USER_NAME]: authenticated && name ? name : null,
        // `session.role ?? session.user.role` — the store derives `role` from the user, but a host that
        // does not (the harness sets both explicitly) should not have to.
        [ATTR_USER_ROLE]: authenticated ? (session.role ?? session.user?.role ?? null) : null,
    };
}

/** The signed-out projection, used when a host passes a session it turns out we cannot read. */
const SIGNED_OUT: SessionSnapshot = { isAuthenticated: false, user: null, role: null };

/**
 * The `AttributeProjector` handed to `createCustomElementLifecycles('nav-app-bar', …)`.
 *
 * Returns `null` when the host passed no session at all — a supported outcome, not a failure: the
 * element's no-attributes state is the signed-out bar, which is exactly what a bare mount should show.
 *
 * When a session *is* present, `get()` re-reads it rather than closing over a snapshot. `customProps`
 * are fixed at registration while the session behind them is not, so a captured value would show the
 * state at mount time forever — the same trap as the shell's `isAuthenticated` callback in
 * `activity.ts`.
 */
export const projectSession: AttributeProjector = (props: CustomElementMountProps): AttributeSource | null => {
    const session = props.session;
    if (session === undefined || session === null) return null;

    if (!isSessionContext(session)) {
        // Loud, because it is a host mistake with a silent symptom: the bar would sit signed-out over a
        // signed-in application and look like a bug in this package.
        console.warn('[nav] `customProps.session` is not a readable session context; rendering signed out.');
        return { get: () => toAttributes(SIGNED_OUT), subscribe: () => () => {} };
    }

    return {
        get: () => toAttributes(session.getState()),
        subscribe: (onChange) => session.subscribe(onChange),
    };
};
