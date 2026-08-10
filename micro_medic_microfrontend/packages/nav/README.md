# nav

The application chrome: the top app bar and the page footer.

| | |
|---|---|
| Port | 3003 |
| MF name | `nav` |
| Exposes | `./Header`, `./Footer` |
| Stack | **Native custom elements**, TypeScript. No framework. |

## Why no framework

This is the one micro-frontend that is mounted on *every* route, so anything it depends on is paid
for on first paint by every visitor, on every screen. A bar with two links, a user badge and one
button does not have enough state to spend a framework on: `src/reactive-element.ts` is thirty lines
and provides the only two things a framework would have here — re-render on state change, and tear
down subscriptions on unmount.

The more interesting reason is that it makes the integration contract falsifiable. Every claim this
repo makes about composition — single-spa lifecycles, the shared auth store, the event bus, the
`--mm-*` tokens, the design system — is demonstrated here with no framework to hide behind. If any
of it were secretly React-shaped, this package could not exist.

That is *not* an argument against the design system, which this package does use (see below). "No
framework" is about the runtime a fragment forces onto the page, not about reimplementing shared
components.

## It uses the design system

The sign-out control is `<mm-button>`, not a locally styled `<button>`.

A custom element consuming another custom element needs no binding layer at all — `<mm-button>` in a
template string is just a tag, which is exactly why `design-system-react` and `design-system-angular`
exist and this package needs no equivalent. And a hand-rolled button here would be the worst place
in the application for one: it would look nearly right, then drift on the first theme change, in the
most visible element on every screen.

`lit` and `@micro-medic/design-system` are therefore federation singletons in `webpack.config.js`.
Custom element registration is global to the document, so a second copy of the design system would
find every `mm-*` tag already defined and its component classes would never be used — whichever
remote loaded first would silently own the components. The marginal cost is nil in practice: the
shell already has Lit on the page for `calendar` and `auth`.

The one thing this package must never ship is the document-wide theme (`tokens.css` / `global.css`).
The shell loads that once. Two remotes each shipping a reset is the classic micro-frontend CSS
collision, and whichever loads second silently wins. `src/styles.css` holds only `nav-*`-namespaced
rules, every value a token.

## Two applications, one package

`./Header` and `./Footer` are separate single-spa applications because the shell mounts them at
opposite ends of the document — a layout fact. They are one *package* because they are one team's
concern and always change together: the cost of a micro-frontend is paid per repository and
pipeline, not per component, so splitting them would add a deployable without adding any
independence.

Toasts used to be a third application here and are now the `notifications` MFE on :3007. The route
table gave it away: the chrome is suppressed on `/login` and `/register`, while a failed-login toast
has to appear on exactly those routes. A fragment with a different activity function, a different set
of consumers and a different reason to change is a different micro-frontend.

## How it stays in sync

Nothing here is queried; everything is a reaction to something the package does not own.

- **Auth state** — `authStore.subscribe()`, and `authStore.getState()` re-read on connect (a login
  can happen between construction and mount). Also what decides which links are offered: `roles` in
  `src/nav-links.ts` is a *presentation* hint, never authorisation. The backend enforces access per
  request in `@PreAuthorize`/`AccessGuard`.
- **The route** — both `popstate` *and* `single-spa:routing-event`, because neither alone is enough:
  `popstate` misses `pushState` (every in-app navigation) and the single-spa event does not exist in
  the standalone harness.
- **Sign out** — `authStore.logout()` and nothing else. It deliberately does not navigate; the store
  emits `AUTH_LOGOUT` and the shell redirects, so a logout from here, from a 401 interceptor, or from
  another tab behaves identically.

## Details worth not undoing

- **Light DOM, not shadow.** The opposite of every `mm-*` component, on purpose: the chrome's job is
  to *be* the page frame, so it wants `.mm-appbar` from the shell's `global.css` to apply to it and
  pin it to the shared `--mm-header-height`. Encapsulation is right for a reusable widget and wrong
  for the frame around the widgets.
- **`role="banner"` / `role="contentinfo"`, set explicitly.** A custom element has no implicit ARIA
  semantics — `<nav-app-bar>` is an unknown tag where `<header>` would have announced itself. This is
  the one real cost of the approach, and it is one attribute per element.
- **One delegated click listener on the host.** `render()` replaces the whole subtree, so a listener
  bound to a rendered node would be discarded on the next state change. Delegation also survives
  `<mm-button>`'s shadow boundary: its internal click is composed, and a composed event is retargeted
  to the host, so `event.target` is the `<mm-button>` carrying `data-nav-action`.
- **Real `<a href>`s, intercepted.** The handler bails on middle-click, modifier-click, a non-`_self`
  target and a cross-origin href — intercepting those is the most common way an SPA breaks a link.
  `aria-current="page"` carries the "you are here" state *and* is the styling hook, so the visual and
  announced states cannot disagree.
- **Segment-boundary matching.** `isCurrent` requires the next character to be `/` or nothing, so
  `/calendar` does not light up on `/calendar-archive`.
- **`escapeHtml` is mandatory.** `render()` builds markup by concatenation and interpolates the
  user's name, which comes from the backend.
- **Skip link first.** It matters more in a composed app than a monolithic one: the chrome remounts
  on every route, so without it a keyboard user tabs the whole bar again on every navigation. Its
  target id is `MAIN_LANDMARK_ID`, a contract with the shell — which owns the `<main>` landmark,
  because it owns the composition.
- **`src/lifecycles.ts` is gone**; the adapter lives in the design system as
  `createCustomElementLifecycles`, shared with `notifications`. A custom element's
  `connectedCallback`/`disconnectedCallback` already *are* single-spa's contract, so the adapter only
  appends and removes a node. The alternative, `single-spa-html`, mounts by assigning `innerHTML` and
  ships no types; nothing in the repo uses it any more (`icd10` did, before it became a Vue app with
  hand-written lifecycles of its own).

## Running it

```sh
yarn workspace nav start      # webpack --watch
yarn workspace nav serve      # serve dist -p 3003
yarn workspace nav typecheck
```

`src/standalone.ts` + `public/index.html` are a shell-free harness that fakes the two inputs the
chrome reacts to: buttons that sign in as a doctor or a patient, and buttons that drive real
`pushState` navigations. Sign in as each role to see the link set change; switch to
`/calendar-archive` to see segment matching hold. No backend is needed — nothing here calls an API.
