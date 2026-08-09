import { authStore, type AuthState } from '@micro-medic/shared-store';
/*
 * Also a side-effect import: reaching the package registers every `mm-*` element. The bar renders
 * `<mm-button>`, so the tag has to be defined before the first render — see the note in the class
 * comment about why the chrome consumes the design system rather than styling its own button.
 *
 * `defineElement` comes from there as well. The custom element registry is per document, so the
 * guard it applies (a duplicate `define` throws and would take down whichever copy loaded second)
 * is about the registry rather than about `mm-*` tags — and a local copy of the same eight lines
 * would be duplication for its own sake now that the dependency exists regardless.
 */
import { defineElement } from '@micro-medic/design-system';
import { ReactiveElement, escapeHtml } from './reactive-element.js';
import { HOME_HREF, LOGIN_HREF, MAIN_LANDMARK_ID, isCurrent, visibleLinks } from './nav-links.js';

/**
 * The application's navigation bar.
 *
 * A native custom element with no *framework* behind it, which is the point of this package: the
 * chrome is mounted on **every** route, so whatever runtime it needs is a runtime the whole
 * application pays for on first paint. React, Angular and Svelte each earn their weight in a
 * feature MFE with forms, queries and derived state; a bar with two links and one button does not
 * have enough state to spend a framework on. What it does instead is show that the integration
 * contract — single-spa lifecycles, the shared store, the event bus, the design system — is
 * genuinely framework-agnostic, because here there is no framework to hide behind.
 *
 * **It still uses the design system.** That is not a contradiction: the design system is Lit
 * elements, and a custom element is exactly what has no trouble consuming another custom element.
 * `<mm-button>` in a template string is just a tag — no binding layer needed, which is precisely
 * why `design-system-react` and `design-system-angular` exist and this package needs no
 * equivalent. And the bar must not hand-roll its own button: a control that is styled locally
 * looks nearly right, then drifts on the first theme change, and the chrome is the most visible
 * place for that to happen. The one thing an MFE may never do is ship the document-wide theme
 * (`tokens.css`/`global.css`) — the shell loads that once.
 *
 * **Light DOM, deliberately.** Every `mm-*` component renders into a shadow root to be
 * unreachable from outside; this element does the opposite and keeps its children in the document,
 * because the chrome's job is to *be* the page frame. It wants `.mm-appbar` from `global.css` to
 * apply to it, so its height is the same `--mm-header-height` every other fragment lines up
 * against. Encapsulation is the right default for a reusable widget and the wrong one for the
 * frame around the widgets.
 *
 * Nav knows the route *table* — it renders the links — but not the routing *rules*. The shell
 * decides what mounts (`home/src/routes.js`); a link to a route the visitor cannot view is
 * redirected by the shell, not hidden by a check here.
 */
export class NavAppBar extends ReactiveElement {
    /**
     * The last auth snapshot, kept as a field because `render()` must be synchronous and pure.
     *
     * Reading `authStore.getState()` inside `render()` would work too, and this is the better
     * habit: it makes the render a function of *this element's* state, so what is on screen is
     * always exactly what the last notification carried.
     */
    private auth: AuthState = authStore.getState();

    private pathname: string = window.location.pathname;

    protected subscribe(): Array<() => void> {
        const onAuthChange = (state: AuthState) => {
            this.auth = state;
            this.requestRender();
        };

        const onRouteChange = () => {
            const next = window.location.pathname;
            // Guard the assignment, not just the render: single-spa fires a routing event for
            // every reroute, including ones that did not change the path.
            if (next === this.pathname) return;
            this.pathname = next;
            this.requestRender();
        };

        // Re-read on connect: a navigation or a login may have happened between the constructor
        // and now (the element is created, then appended, then rendered).
        this.auth = authStore.getState();
        this.pathname = window.location.pathname;

        /*
         * Two route listeners, because neither is sufficient:
         *   - `popstate` fires for the back/forward buttons but NOT for `pushState`, which is how
         *     every in-app navigation happens;
         *   - `single-spa:routing-event` fires after single-spa reroutes, which covers `pushState`.
         */
        window.addEventListener('popstate', onRouteChange);
        window.addEventListener('single-spa:routing-event', onRouteChange);

        return [
            // `subscribe` hands back its own teardown, so it is already the right shape.
            authStore.subscribe(onAuthChange),
            () => window.removeEventListener('popstate', onRouteChange),
            () => window.removeEventListener('single-spa:routing-event', onRouteChange),
        ];
    }

    /**
     * One delegated listener on the host, attached in the constructor rather than per render.
     *
     * `render()` replaces the whole subtree, so a listener bound to a rendered `<a>` or `<button>`
     * would be discarded on the next state change — the classic bug of this rendering strategy.
     * The host element itself survives every render, so a listener here does not have to be
     * re-attached, and does not need removing on disconnect either: it is on the element being
     * removed, so it is collected with it.
     *
     * Delegation also survives the shadow boundary of `<mm-button>`. Its internal `<button>` fires
     * a composed click, and a composed event crossing out of a shadow tree is *retargeted* to the
     * host — so `event.target` here is the `<mm-button>` itself, carrying the `data-nav-action`
     * attribute this handler looks for. Nothing has to reach inside the component.
     */
    constructor() {
        super();
        this.addEventListener('click', this.onClick);

        /*
         * The host carries the layout classes rather than a wrapper `<div>` inside it.
         *
         * `.mm-appbar` is the design system's bar primitive — it is what pins this to
         * `--mm-header-height`, so the chrome and every fragment below it line up against the same
         * number. An unstyled custom element is `display: inline` by default, so without a class
         * (or the `display` rule in `styles.css`) the bar would not lay out at all.
         *
         * `role="banner"` because a custom element has no implicit semantics: `<nav-app-bar>` is
         * an unknown tag to assistive technology, where `<header>` at the top level would have
         * announced itself. This is the one real cost of the custom-element approach, and it is
         * one attribute.
         */
        this.classList.add('mm-appbar', 'nav-bar');
        this.setAttribute('role', 'banner');
    }

    private readonly onClick = (event: MouseEvent): void => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        if (target.closest('[data-nav-action="sign-out"]')) {
            /*
             * Clears local state only. There is no token-revocation endpoint and a JWT stays
             * valid until it expires, so "sign out" means "this browser forgets the token".
             *
             * It deliberately does not navigate: `logout()` emits `AUTH_LOGOUT`, the shell
             * listens for that and redirects. A logout triggered from here, from a 401
             * interceptor, or from another tab therefore behaves identically — and the bar does
             * not need to know where the login screen lives.
             */
            authStore.logout();
            return;
        }

        const link = target.closest('a[data-nav-link]');
        if (!(link instanceof HTMLAnchorElement)) return;

        /*
         * Let the browser win when the user asked for the browser's behaviour: middle-click,
         * ctrl/cmd-click and shift-click all mean "open this somewhere else", and intercepting
         * them is the single most common way an SPA breaks a real `<a href>`. Same for a link the
         * browser would handle anyway (`target="_blank"`, a different origin).
         */
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target && link.target !== '_self') return;
        if (link.origin !== window.location.origin) return;

        /*
         * `pushState` + a synthetic `popstate`, rather than importing `navigateToUrl` from
         * `single-spa`.
         *
         * Not to avoid a dependency for its own sake: the shell is on single-spa 5 while
         * `calendar` and `auth` are on 6, so the version is deliberately *not* federated as a
         * singleton (see `home/webpack.config.js`). A remote that imports it bundles a second
         * copy, and each copy patches `window.history` — the mechanism works, but the chrome is
         * the one MFE that can avoid taking part. These two lines are precisely what
         * `navigateToUrl` does for a same-origin path, and the shell's router hears the event
         * either way, whichever single-spa copy is patching history.
         */
        event.preventDefault();
        if (link.pathname === window.location.pathname && link.search === window.location.search) {
            // Already here — pushing a duplicate entry would break the back button.
            return;
        }
        window.history.pushState(null, '', link.href);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    protected render(): string {
        const { isAuthenticated, user, role } = this.auth;

        return `
            ${this.renderSkipLink()}
            <a class="mm-appbar__title" href="${HOME_HREF}" data-nav-link>MicroMedic</a>
            ${isAuthenticated ? this.renderLinks() : ''}
            <div class="nav-bar__account">
                ${
                    isAuthenticated
                        ? `
                            <span class="nav-bar__user">
                                <span class="nav-bar__name">
                                    ${user ? escapeHtml(`${user.firstname} ${user.lastname}`) : 'Signed in'}
                                </span>
                                ${role ? `<span class="nav-bar__role">${escapeHtml(formatRole(role))}</span>` : ''}
                            </span>
                            <mm-button variant="tertiary" size="sm" data-nav-action="sign-out">
                                Sign out
                            </mm-button>
                          `
                        : /*
                           * A link, not an `<mm-button>`, and the asymmetry with sign-out above is
                           * the point: signing out is an action on local state, signing in is a
                           * navigation to `/login`. Rendering the navigation as a button would cost
                           * the middle-click, the "open in new tab" and the status-bar preview that
                           * a real `<a href>` gives for free, and would announce a link as a button.
                           * It is styled like the bar's other links rather than like a button,
                           * because in this design system a button-looking control means "this does
                           * something here".
                           */
                          `<a class="nav-bar__link" href="${LOGIN_HREF}" data-nav-link>Sign in</a>`
                }
            </div>
        `;
    }

    /**
     * "Skip to content", the first focusable thing on the page.
     *
     * Worth more in a composed application than in a monolithic one: the chrome is mounted on
     * every route and sits first in DOM order, so without this a keyboard or screen-reader user
     * tabs through the entire bar again on every single navigation before reaching the fragment
     * they came for.
     *
     * The target id is a contract with the shell — the shell owns the `<main>` landmark because it
     * owns the composition, and `MAIN_LANDMARK_ID` names the id in one place so the two cannot
     * drift.
     */
    private renderSkipLink(): string {
        return `<a class="nav-bar__skip" href="#${MAIN_LANDMARK_ID}">Skip to content</a>`;
    }

    private renderLinks(): string {
        const links = visibleLinks(this.auth.role);
        if (links.length === 0) return '';

        const items = links
            .map(({ href, label }) => {
                const current = isCurrent(this.pathname, href);
                /*
                 * A real `<a href>`, intercepted above rather than replaced by a click handler:
                 * the status bar shows the destination, "open in new tab" works, and the link is
                 * announced as a link. `aria-current` carries the "you are here" state and is
                 * also the styling hook — one attribute instead of a class that has to be kept in
                 * agreement with it.
                 */
                return `<a class="nav-bar__link" href="${href}" data-nav-link${current ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
            })
            .join('');

        return `<nav class="nav-bar__links" aria-label="Main">${items}</nav>`;
    }
}

/** `DOCTOR` → `Doctor`. The enum values are the backend's `Role.name()`, which is shouting. */
function formatRole(role: string): string {
    return role.charAt(0) + role.slice(1).toLowerCase();
}

defineElement('nav-app-bar', NavAppBar);

declare global {
    interface HTMLElementTagNameMap {
        'nav-app-bar': NavAppBar;
    }
}
