# micro_medic — micro-frontends

single-spa shell plus webpack Module Federation remotes. Doctors schedule appointments and
record examinations; the Spring Boot monolith in `../micro_medic_monolith_backend` serves the API
at `http://localhost:8080` (hardcoded in `packages/api-client/src/config.ts`).

## Getting started

```sh
yarn install
yarn start        # every package: build --watch + static serve
```

Open [http://localhost:3001](http://localhost:3001) — the `home` shell. Start the backend first,
otherwise every request fails with a network `ApiError`. You will land on `/login`; the shell
redirects there whenever there is no token.

```sh
yarn verify                         # lint + typecheck + build — what CI runs
yarn lint                           # eslint across every package
yarn typecheck                      # every package that has a tsconfig
yarn build                          # every package
yarn workspace calendar typecheck   # just one
```

`ngc` is worth running separately for the Angular bindings, because `tsc` alone checks neither
template expressions nor host bindings:

```sh
npx ngc -p packages/design-system-angular/tsconfig.json --outDir /tmp/ngc
```

## Packages

Remotes are loaded from hardcoded ports, so the port a package serves on is part of the contract.
Adding a remote means two edits, both in `home`: the `REMOTES` map in `webpack.config.js` — entries
are `name@url`, the lazy form, so webpack injects the container script at the first `import()` and
`public/index.html` needs no `<script>` tag — and an entry in `src/routes.ts`. Add a
`<div id="single-spa-application:NAME">` too if it should render somewhere specific — single-spa
appends its own div to `<body>` otherwise, which puts the app outside the shell's layout.

A remote that is unreachable therefore fails one `import()` rather than the whole document, and
`home/src/index.ts` answers it with `addErrorHandler`: the failure is drawn into that remote's own
mount point and the rest of the page keeps working.

| Port | Package | MF name | Exposes |
|---|---|---|---|
| 3001 | `home` (shell) | `home` | — |
| 3002 | `icd10` | `icd10` | `./ICD10` |
| 3003 | `nav` | `nav` | `./Header`, `./Footer` |
| 3004 | `examination` | `examination` | `./Examination` |
| 3006 | `auth` | `auth` | `./Auth` |
| 3007 | `notifications` | `notifications` | `./Notifications` |
| 3009 | `calendar` | `calendar` | `./Calendar` |

Ports 3005 and 3008 are free. Every remote in that table renders UI; `shared-store` used to be one
too, on 3005, purely because the shell was plain JS and a federated remote was the only way it could
reach a TypeScript library. The shell is TypeScript now and imports it from source like everyone else.

`nav` and `notifications` are **native custom elements with no framework** — both are mounted on
every route, so any runtime they pulled in would be paid for on first paint by every visitor. They
are also what makes the integration contract falsifiable: single-spa lifecycles, parent-supplied
context, the event bus and the design system are all demonstrated there with no framework to hide
behind. `nav` goes furthest — it takes the session as **attributes** and asks for a sign-out with a
bubbling event, so it depends on no shared state at all. Each has its own README.

Library packages have no webpack and no build step — they are consumed as TypeScript sources
through the `paths` map in `tsconfig.base.json`:

- `shared-types` — the backend contract: DTOs, enums, event payloads. Mirror any backend DTO
  change here first.
- `api-client` — one axios instance behind `httpClient`; `createService(basePath)` per domain.
- `shared-store` — `authStore` and `eventBus`, deduped across bundles via `globalThis`, plus the
  `BroadcastChannel` that syncs the session across tabs.
- `design-system` — Lit elements (`mm-button`, `mm-select`, `mm-modal`, `mm-toast-region`, …);
  registration is an import side effect. Also exports `createCustomElementLifecycles`, the
  single-spa adapter a custom-element MFE mounts through — which optionally projects the host's
  `customProps` onto the element as attributes.
- `design-system-react` / `design-system-angular` — framework bindings for those elements.

## Routing and composition

The shell owns routing, and it is the shell's only real logic. `packages/home/src/routes.ts` is a
declarative table — `{ name, load, routes, exceptRoutes?, layout?, public? }` — and
`activity.ts` turns each entry into a single-spa activity function. Two things follow from keeping
it there:

- **A remote never decides when it mounts.** Composition is a property of the whole, so it lives
  in the one package that can see the whole. Otherwise you cannot answer "what renders on
  `/examination`?" without reading every remote, and two of them eventually claim the same route.
- **Route matching is on segment boundaries**, not `startsWith` — `/calendar` must not match
  `/calendar-archive`.

The auth check in `activity.ts` is *navigation, not security*: it keeps an unauthenticated visitor
off an empty calendar. The backend enforces access per request in `@PreAuthorize` and
`AccessGuard`, and would reject the calendar's API calls regardless of what the shell mounted.

Two composition patterns are deliberately demonstrated:

- **Vertical split** — one MFE owns the viewport for a route. `auth` (`layout: 'full'`) mounts
  outside `.mui-container` with the chrome suppressed via `exceptRoutes`, so the login screen is
  full-bleed.
- **Horizontal split** — several MFEs share one screen. `/examination` composes `examination` (the
  form, three quarters of the width) beside `icd10` (the disease catalogue, the remaining quarter).
  They communicate only over the event bus (`ICD10_DISEASE_SELECTED`); neither imports the other,
  and either can be redeployed alone. They are also in different frameworks — Angular 22 and Vue 3 —
  which is what makes "the composition boundary is the browser, not a build step" something you can
  check rather than something the thesis merely asserts.

  The 3:1 geometry is the **shell's**, not either remote's: `.mm-split--primary` in `global.css`,
  applied around the two mount points in `home/public/index.html`. A fragment renders into its own
  mount point and cannot see the screen it shares, so a remote claiming a share of the width would
  be imposing a layout on a sibling it cannot observe.

A third shape shows up in the table as the entries with `routes: ['*']`: the always-mounted
fragments. `nav`'s header and footer take an `exceptRoutes` so the chrome is off on `/login`;
`notifications` is the only entry with no `exceptRoutes` at all, because a failed sign-in is
exactly the case that most needs a toast. That difference in activity function is what makes the
toast layer a separate MFE from the chrome rather than a third application inside it.

## Cross-MFE communication

Four mechanisms, and which one applies is decided by the **topology** of the two participants rather
than by which MFEs they happen to be:

| Participants | Mechanism | Where |
|---|---|---|
| parent → fragment | **attributes** (`customProps` → `observedAttributes`) | shell → `nav` |
| fragment → parent | a **bubbling `CustomEvent`** | `nav:sign-out` → shell |
| sibling fragments on one screen | the **event bus** | `icd10` → `examination` |
| across a mount boundary | the **URL** | `calendar` → `examination` |

Plus one that is not between MFEs at all: **`BroadcastChannel`** (`shared-store/src/session-channel.ts`)
carries a session change to the *other tabs*, where each store re-emits it locally.

**Attributes and a bubbling event, where one participant contains the other.** The shell registers
every application with `customProps: { session: authContext }`, and
`createCustomElementLifecycles` projects that onto `<nav-app-bar>` as
`authenticated` / `user-name` / `user-role`; the sign-out button dispatches `nav:sign-out` and the
shell answers it. The result is worth stating plainly: **the chrome imports nothing from
`shared-store`** — attributes in, events out, no shared mutable state. It is also where the pattern
stops. The four framework MFEs keep importing `authContext`, because they need the user object and
change notifications, and there is no scalar projection of that — a prop would hand them the *same
object* one hop later and decouple nothing. See `packages/nav/README.md`.

**The bus, for siblings.** `shared-store` exports two module-level singletons, deduped across bundles
through `globalThis.__MICRO_MEDIC_AUTH_STORE__` / `__MICRO_MEDIC_EVENT_BUS__` so that federation
cannot give two remotes two different stores:

- `authStore` — token and current user, hydrated from `localStorage`. Importing it is also the
  api-client bootstrap: `auth-store.ts` calls
  `configureApiClient({ getAuthToken, onUnauthorized })` at construction.
- `eventBus` — a typed wrapper over a private `EventTarget`, keyed by `EventTypes` from
  `shared-types`.

Set `window.__MICRO_MEDIC_DEBUG__ = true` in the console to trace bus traffic; the flag is read
per call, so it works without a reload.

**The URL, when the two are never mounted together.** The bus has no replay and single-spa unmounts an
application on navigating away from its route, so two MFEs on disjoint routes can never hear each
other. `calendar` hands off to `examination` as `/examination?appointmentId=<id>`, which survives a
reload and is re-authorized on arrival. `shared-types/src/events.ts` carries the reachability table.

## Design system

Implemented **once, in Lit**, and never reimplemented per framework. What differs per framework is
only how much glue it takes to consume the same elements — and with four frameworks in the repo,
that turns out to be a **spectrum rather than a per-framework tax**:

| Consumer | Glue needed | Why |
|---|---|---|
| `nav`, `notifications` (custom elements) | **none** | a custom element consuming another needs no adapter |
| `icd10` (Vue 3) | **one predicate + a `.d.ts`** | Vue sets non-primitive bindings as properties and `@mm-input` via `addEventListener`; it only needs `isCustomElement` in the build so the compiler emits the tag, and a `GlobalComponents` interface so `vue-tsc` checks the bindings |
| `calendar`, `auth` (React 19) | **`design-system-react`** | JSX offers no prop for a custom event, so `mm-close` otherwise needs a `useRef` + `addEventListener` per element. (React ≤18 also stringified unknown props onto attributes — `open={false}` → a truthy `"false"` — but 19 assigns to a matching instance property first, so that half is historical) |
| `examination` (Angular 22) | **`design-system-angular`** | a directive per tag, so the template type-checks without `CUSTOM_ELEMENTS_SCHEMA`, which would disable checking for every unknown tag in the component |

Read down that table and the two binding packages stop looking like architecture and start looking
like what they are: **compensation for specific framework defects.** Vue is the control case — it
needs essentially nothing, which is why there is deliberately no `design-system-vue`. The Vue types
live in `icd10` rather than in `design-system`, since a `GlobalComponents` interface in the shared
package would make all five consumers depend on Vue's types to get at a Lit element.

**CSS scope is the rule that matters.** Components render into a shadow root, so a document-level
selector cannot reach their internals — it is unreachable by construction, not merely unused. The
ways in are a `--mm-*` custom property (custom properties pierce shadow DOM) or an exported
`part`. `tokens.css` and `global.css` are document-level and **loaded once, by the shell**: two
remotes each shipping a reset is the classic micro-frontend collision, and whichever loads second
silently wins. Per-MFE styles stay in that MFE, namespaced (`calendar/src/styles.css` uses a
`cal-block__element` convention) and referencing tokens rather than literal hex.

## Tooling

`eslint.config.mjs` is one flat config for the whole monorepo, layered "everything → TypeScript →
React → exceptions → prettier". A single root config rather than one per package, because the
conventions worth enforcing here are *cross-package* ones, and because per-package configs would
drift across the three eras of tooling in this repo. Type-aware linting is on for `.ts`/`.tsx`,
which is what makes `no-floating-promises` possible — the rule that earns its keep when every
mutation returns a promise and a dropped one is a silent no-op.

Several rules are deliberately off, each with the reason recorded at the rule. Read the comment
before re-enabling one: `unbound-method` fights Lit's event-binding contract, and the `{}` in
`design-system-react/src/create-component.ts` is load-bearing (`keyof {}` is `never`, so nothing is
stripped from the props; `Record<string, never>` strips every prop and breaks every call site).

Prettier is adopted **report-only**: the config governs new and touched files, but the ~86
pre-existing files have not been reflowed, so `format:check` is outside `verify` and non-blocking
in CI. Run `yarn format` as its own commit to switch it on — alone, never mixed with a change, or
the reflow buries the real diff.

CI is two workflows in `../.github/workflows/`. `frontend.yml` runs lint + typecheck, then builds
every MFE; `backend.yml` builds the monolith against a MySQL service container, which makes its
one `contextLoads()` test verify the whole Flyway chain against the entity model.

## Notes

- Both `yarn.lock` and `package-lock.json` are checked in. The workspace tooling (`wsrun`,
  `yarn workspaces`) is Yarn's — use Yarn and treat `package-lock.json` as stale.
- **`yarn install` may fail behind a corporate npm proxy.** The cause is a registry mismatch, not
  an unavailable package: `~/.npmrc` may point npm at an internal mirror while Yarn reads
  `registry.yarnpkg.com` from `~/.yarnrc`, and some mirrors 403 the `lodash` tarballs that
  `react-big-calendar` pulls. Fix it in your own machine-local config; the root `.gitignore`
  excludes `.npmrc`/`.yarnrc` on purpose, since a checked-in override would silently redirect
  every contributor's installs.
- **No tests.** No package declares a `test` script. `api-client` and `shared-store` used to
  declare `"test": "jest"` with no jest config, no test files and — in `shared-store`'s case — no
  jest dependency, so the script could only ever fail; both have been removed. Test
  infrastructure is deferred, and lint + typecheck + build are the automated checks today.
- **Every package is TypeScript now**, the shell included. `home` was the last plain-JS one, and
  porting it did more than add types: with ts-loader it resolves `@micro-medic/shared-store` from
  source through the `paths` map, which is what let the `shared_store` federated remote and its port
  go away. It is still three small files with no UI of its own.
- **Multiple frameworks coexisting is intentional.** React 19, Angular 22, Vue 3, Lit and plain
  custom elements in one application is the thing federation is meant to make possible, and
  demonstrating it is a goal here, not debt. Every feature MFE is implemented: `calendar` (React),
  `auth` (React), `examination` (Angular), `icd10` (Vue), `nav` and `notifications` (custom
  elements).
