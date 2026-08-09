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
Adding a remote means three edits, all in `home`: the `remotes` map in `webpack.config.js`, a
`<script>` tag in `public/index.html`, and an entry in `src/routes.js`. Add a
`<div id="single-spa-application:NAME">` too if it should render somewhere specific — single-spa
appends its own div to `<body>` otherwise, which puts the app outside the shell's layout.

| Port | Package | MF name | Exposes |
|---|---|---|---|
| 3001 | `home` (shell) | `home` | — |
| 3002 | `icd10` | `icd10` | `./ICD10` |
| 3003 | `nav` | `nav` | `./Header`, `./Footer` |
| 3004 | `examination` | `examination` | `./Examination` |
| 3005 | `shared-store` | `shared_store` | `./store` |
| 3006 | `auth` | `auth` | `./Auth` |
| 3007 | `notifications` | `notifications` | `./Notifications` |
| 3009 | `calendar` | `calendar` | `./Calendar` |

Port 3008 is free.

`nav` and `notifications` are **native custom elements with no framework** — both are mounted on
every route, so any runtime they pulled in would be paid for on first paint by every visitor. They
are also what makes the integration contract falsifiable: single-spa lifecycles, the auth store,
the event bus and the design system are all demonstrated there with no framework to hide behind.
Each has its own README.

Library packages have no webpack and no build step — they are consumed as TypeScript sources
through the `paths` map in `tsconfig.base.json`:

- `shared-types` — the backend contract: DTOs, enums, event payloads. Mirror any backend DTO
  change here first.
- `api-client` — one axios instance behind `httpClient`; `createService(basePath)` per domain.
- `shared-store` — `authStore` and `eventBus`, deduped across bundles via `globalThis`.
- `design-system` — Lit elements (`mm-button`, `mm-select`, `mm-modal`, `mm-toast-region`, …);
  registration is an import side effect. Also exports the two single-spa adapters for custom
  elements, `createCustomElementLifecycles` (an application) and `mountDesignSystemParcel` (a
  parcel).
- `design-system-react` / `design-system-angular` — framework bindings for those elements.

## Routing and composition

The shell owns routing, and it is the shell's only real logic. `packages/home/src/routes.js` is a
declarative table — `{ name, load, routes, exceptRoutes?, layout?, public? }` — and
`activity.js` turns each entry into a single-spa activity function. Two things follow from keeping
it there:

- **A remote never decides when it mounts.** Composition is a property of the whole, so it lives
  in the one package that can see the whole. Otherwise you cannot answer "what renders on
  `/examination`?" without reading every remote, and two of them eventually claim the same route.
- **Route matching is on segment boundaries**, not `startsWith` — `/calendar` must not match
  `/calendar-archive`.

The auth check in `activity.js` is *navigation, not security*: it keeps an unauthenticated visitor
off an empty calendar. The backend enforces access per request in `@PreAuthorize` and
`AccessGuard`, and would reject the calendar's API calls regardless of what the shell mounted.

Two composition patterns are deliberately demonstrated:

- **Vertical split** — one MFE owns the viewport for a route. `auth` (`layout: 'full'`) mounts
  outside `.mui-container` with the chrome suppressed via `exceptRoutes`, so the login screen is
  full-bleed.
- **Horizontal split** — several MFEs share one screen. `/examination` composes `icd10` (the
  disease catalogue) beside `examination` (the form). They communicate only over the event bus
  (`ICD10_DISEASE_SELECTED`); neither imports the other, and either can be redeployed alone.

A third shape shows up in the table as the entries with `routes: ['*']`: the always-mounted
fragments. `nav`'s header and footer take an `exceptRoutes` so the chrome is off on `/login`;
`notifications` is the only entry with no `exceptRoutes` at all, because a failed sign-in is
exactly the case that most needs a toast. That difference in activity function is what makes the
toast layer a separate MFE from the chrome rather than a third application inside it.

## Cross-MFE communication

`shared-store` exports two module-level singletons, deduped across bundles through
`globalThis.__MICRO_MEDIC_AUTH_STORE__` / `__MICRO_MEDIC_EVENT_BUS__` so that federation cannot
give two remotes two different stores:

- `authStore` — token and current user, hydrated from `localStorage`. Importing it is also the
  api-client bootstrap: `auth-store.ts` calls
  `configureApiClient({ getAuthToken, onUnauthorized })` at construction.
- `eventBus` — a typed wrapper over a private `EventTarget`, keyed by `EventTypes` from
  `shared-types`.

Set `window.__MICRO_MEDIC_DEBUG__ = true` in the console to trace bus traffic; the flag is read
per call, so it works without a reload.

## Design system

Implemented **once, in Lit**, with a thin binding layer per framework — never reimplemented per
framework. React consumers import `@micro-medic/design-system-react`, Angular consumers
`@micro-medic/design-system-angular`, and the plain-JS/Svelte MFEs use the tags directly — as do
`nav` and `notifications`, since a custom element consuming another custom element needs no
binding layer at all. That is precisely what the two binding packages exist to compensate for.

The bindings are not ceremony. React (through 19) stringifies unknown JSX props onto attributes,
so `rows={[…]}` becomes `"[object Object]"` and `open={false}` becomes a truthy `"false"`, and it
offers no prop for a custom event. Angular needs a directive per tag so the template can be
type-checked without `CUSTOM_ELEMENTS_SCHEMA`, which would disable checking for every unknown tag
in the component.

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
- **No tests.** `api-client` and `shared-store` declare `"test": "jest"`, but there is no jest
  config and no test files. Test infrastructure is deferred.
- Legacy packages (`home`, `icd10`, `examination`) are plain JS on single-spa v5 / React 18, and
  call the backend directly with hand-built auth headers rather than through `api-client`. Their
  store imports and API paths have been corrected (they previously used a `store/store` specifier
  matching neither the remote's name nor its exports, and a stale `/api/v1/...` prefix), but they
  are still the old pattern — port toward the TypeScript packages rather than extending them.
  `nav` has already been ported and is no longer among them.
- **Multiple frameworks coexisting is intentional.** React, Svelte, Lit and plain custom elements
  in one application is the thing federation is meant to make possible, and demonstrating it is a
  goal here, not debt. Complete features: `calendar`, `auth`, `nav`, `notifications`; the rest are
  placeholders.
