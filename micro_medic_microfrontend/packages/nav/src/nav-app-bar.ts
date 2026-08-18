import { NAV_SIGN_OUT_EVENT, type Role } from '@micro-medic/shared-types';
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
import { HOME_HREF, LOGIN_HREF, MAIN_LANDMARK_ID, isCurrent, parseRole, visibleLinks } from './nav-links.js';

// The attribute names are shared with the projection that writes them — one definition, because a
// disagreement between the two is silent. See that file for why the session is projected as scalars.
import { ATTR_AUTHENTICATED, ATTR_USER_NAME, ATTR_USER_ROLE } from './session-attributes.js';

/**
 * The application's navigation bar.
 *
 * A native custom element with no *framework* behind it, which is the point of this package: the
 * chrome is mounted on **every** route, so whatever runtime it needs is a runtime the whole
 * application pays for on first paint. React and Angular each earn their weight in a feature MFE
 * with forms, queries and derived state; a bar with two links and one button does not
 * have enough state to spend a framework on. What it does instead is show that the integration
 * contract — single-spa lifecycles, the design system, and the browser's own attributes and events —
 * is genuinely framework-agnostic, because here there is no framework to hide behind.
 *
 * **Attributes in, events out**, and that is the entire coupling: the session arrives as
 * `authenticated` / `user-name` / `user-role`, set by the shell through
 * `createCustomElementLifecycles` (Geers §6.1.1), and sign-out leaves as a bubbling
 * `nav:sign-out` (§6.1.2). This element imports nothing from `@micro-medic/shared-store` — it used to
 * read `authStore` and call `logout()` on it, which made the most-visible fragment in the application
 * the one most tightly bound to shared mutable state. A fragment configured this way can be mounted
 * by any host that can set an attribute, including a plain HTML page with no bundler.
 *
 * The trade is real and worth naming: three scalars are less than an `AuthState`, so a projection has
 * to decide what the fragment gets. That is the constraint doing the work rather than a limitation —
 * the bar cannot read a field it was never given, so what it depends on is legible in one place.
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
 * decides what mounts (`home/src/routes.ts`); a link to a route the visitor cannot view is
 * redirected by the shell, not hidden by a check here.
 */
export class NavAppBar extends ReactiveElement {
    /**
     * The session attributes, so a change to any of them re-renders.
     *
     * Nothing is mirrored into a field: the attributes *are* the state, and copying them into one
     * would create a second version of it that has to be kept in agreement. `render()` reads the DOM
     * it is rendering from, which is what a custom element's own input mechanism gives for free.
     */
    static readonly observedAttributes: readonly string[] = [ATTR_AUTHENTICATED, ATTR_USER_NAME, ATTR_USER_ROLE];

    private pathname: string = window.location.pathname;

    /**
     * Fires for attributes set on a *disconnected* element too, which is what lets the adapter set the
     * session before insertion and have the first render already be correct. `requestRender` returns
     * early while disconnected — `connectedCallback` renders on insertion regardless — so that costs
     * nothing here and avoids rendering twice on every mount.
     */
    attributeChangedCallback(): void {
        this.requestRender();
    }

    protected subscribe(): Array<() => void> {
        const onRouteChange = () => {
            const next = window.location.pathname;
            // Guard the assignment, not just the render: single-spa fires a routing event for
            // every reroute, including ones that did not change the path.
            if (next === this.pathname) return;
            this.pathname = next;
            this.requestRender();
        };

        // Re-read on connect: a navigation may have happened between the constructor and now (the
        // element is created, then appended, then rendered). The session needs no equivalent — it
        // arrives as attributes, which are already on the element by the time it is inserted.
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
    }

    protected applyHostSemantics(): void {
        this.classList.add('mm-appbar', 'nav-bar');
        this.setAttribute('role', 'banner');
    }

    private readonly onClick = (event: MouseEvent): void => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        if (target.closest('[data-nav-action="sign-out"]')) {
            /*
             * Announces the intent; the shell decides what it means (Geers §6.1.2). This used to call
             * `authStore.logout()` directly, and the difference is which package owns session
             * *transitions*: the bar knows a button was pressed, not that signing out clears
             * `localStorage`, ends a cross-tab channel session and redirects to `/login`.
             *
             * `bubbles` and `composed`, both load-bearing. Bubbling is what lets the shell listen on
             * `window` without knowing where in the document this fragment mounted — the hierarchy
             * carries the meaning, which is why an event beats the shared bus for the child→parent
             * direction specifically. `composed` because this element's own children are light DOM
             * today, but `<mm-button>`'s are not, and a fragment that grew a shadow root would
             * otherwise stop being heard with no error anywhere.
             *
             * It deliberately does not navigate. A sign-out from here, from the 401 interceptor, or
             * from another tab all end in the same place because none of the three decides where that
             * is.
             */
            this.dispatchEvent(new CustomEvent(NAV_SIGN_OUT_EVENT, { bubbles: true, composed: true }));
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
         * `single-spa` is a shared singleton across `home`, `auth` and `calendar` (see
         * `home/webpack.config.js`), but `nav` imports no framework runtime at all — see the
         * package-level note in `package.json` — so it does not pull the dependency in for two
         * lines. These two lines are precisely what `navigateToUrl` does for a same-origin path,
         * and the shell's router hears the event regardless of which package fired `pushState`.
         */
        event.preventDefault();
        if (link.pathname === window.location.pathname && link.search === window.location.search) {
            // Already here — pushing a duplicate entry would break the back button.
            return;
        }
        window.history.pushState(null, '', link.href);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    /** Present or absent, per the boolean-attribute convention — `"false"` would read as signed in. */
    private get isAuthenticated(): boolean {
        return this.hasAttribute(ATTR_AUTHENTICATED);
    }

    /** Named `userRole` rather than `role`: `HTMLElement.role` already exists, and it holds the landmark. */
    private get userRole(): Role | null {
        return parseRole(this.getAttribute(ATTR_USER_ROLE));
    }

    protected render(): string {
        const { isAuthenticated, userRole } = this;
        const userName = this.getAttribute(ATTR_USER_NAME);

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
                                    ${userName ? escapeHtml(userName) : 'Signed in'}
                                </span>
                                ${userRole ? `<span class="nav-bar__role">${escapeHtml(formatRole(userRole))}</span>` : ''}
                            </span>
                            <mm-button variant="danger" size="sm" data-nav-action="sign-out">
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
        const links = visibleLinks(this.userRole);
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
