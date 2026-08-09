# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent projects, no root build file:

- `micro_medic_monolith_backend/` — Spring Boot 4.1.0 / Java 25 monolith (MySQL + Flyway, JWT auth). Serves `http://localhost:8080`.
- `micro_medic_microfrontend/` — Yarn workspaces monorepo of single-spa micro-frontends wired together with webpack Module Federation.

Root also holds `.github/workflows/` (CI for both projects), a `.gitignore`, and thesis artifacts (`*.docx`, `ERDiagram.png`, `PMOV.drawio`) — this is an academic project (FON, University of Belgrade), a master's thesis on micro-frontend architecture.

**That framing decides trade-offs.** The deliverable is a codebase that *demonstrates* micro-frontend practice, so anything illustrating a principle — the deliberate multi-framework mix, the vertical/horizontal split examples, the shared z-index scale, the one-Lit-implementation-many-bindings design system — is a feature to preserve and document, not duplication to consolidate. Explanatory comments carrying the *why* are part of the artifact. When something must be traded off, favour the version that teaches the architecture over the version that is merely shorter.

## Commands

### Backend (`micro_medic_monolith_backend/`)

```sh
./mvnw spring-boot:run          # run (dev profile by default)
./mvnw package                  # build jar
./mvnw -DskipTests package      # build without the DB-dependent test
./mvnw test                     # run tests
./mvnw test -Dtest=ClassName#methodName   # single test
```

Requires a reachable MySQL at `localhost:3306/micro_medic_monolith_backend`. Env vars: `MYSQL_ROOT_USERNAME`, `MYSQL_ROOT_PASSWORD`, `JWT_SECRET` (Base64, ≥32 bytes), optionally `JWT_EXPIRATION_MS`, `CORS_ALLOWED_ORIGINS`, `SPRING_PROFILES_ACTIVE`.

`./mvnw test` will not pass without a provisioned DB — the only test is a `@SpringBootTest` `contextLoads()` and there is no `src/test/resources`, so it boots the `dev` profile against real MySQL under `ddl-auto=validate`. That makes it more useful than its name suggests: it is effectively a migration test (see "Schema changes require a migration"), and `.github/workflows/backend.yml` runs it against a MySQL 8.4 service container for exactly that reason.

`<java.version>25</java.version>`, which is ahead of most locally installed JDKs — CI sets up JDK 25, so it may be the first place a Java-25-only construct actually gets compiled.

### Frontend (`micro_medic_microfrontend/`)

```sh
yarn install
yarn start        # concurrently: wsrun --parallel start + wsrun --parallel serve
yarn verify       # lint && typecheck && build — what CI runs; run this before pushing
yarn lint         # eslint . (flat config at the monorepo root)
yarn lint:fix     # eslint . --fix
yarn build        # yarn workspaces run build
yarn typecheck    # wsrun --parallel typecheck — all TS packages
yarn workspace calendar typecheck      # tsc --noEmit for one package
npx ngc -p packages/design-system-angular/tsconfig.json --outDir /tmp/ngc   # Angular templates/host bindings
yarn format       # prettier --write . — see the caveat below before running this
```

On Windows + Git Bash the `npx`/`node_modules/.bin` shims for `eslint` and `ngc` fail (the bash shim gets parsed as JS, and it swallows the exit code). Invoke the entry points directly instead:

```sh
node node_modules/eslint/bin/eslint.js .
node node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js -p packages/design-system-angular/tsconfig.json --outDir /tmp/ngc
```

Every TS package (`design-system`, `design-system-react`, `design-system-angular`, `shared-types`, `shared-store`, `api-client`, `calendar`, `auth`, `nav`, `notifications`) typechecks clean, `eslint .` is clean (zero errors *and* zero warnings), and all eight webpack packages build. Keep it that way — `yarn verify` is the single check.

`eslint .` covers the plain-JS packages too, which have no typecheck script; that is the only automated check they have. The React block in `eslint.config.mjs` is scoped to `**/*.tsx` only: no plain-JS package writes JSX any more (`nav` is TypeScript custom elements, `icd10` builds DOM from template strings, `home` has no markup), so the `ecmaFeatures: { jsx: true }` that espree needed is gone. A `files` pattern matching nothing is not an error, so re-adding one would go unnoticed.

**Prettier is report-only.** The config is authoritative for new and touched files, but ~86 pre-existing files are unformatted, so `format:check` is outside `verify` and non-blocking in CI. Run `yarn format` as its own commit to switch it on, never mixed with a real change.

Shell is at `http://localhost:3001` (the `home` package). There is still no test setup anywhere in the monorepo (see "State of the code").

CI lives in `.github/workflows/`: `frontend.yml` (lint + typecheck, then build all MFEs) and `backend.yml` (Maven `verify` against a MySQL 8.4 service container, JDK 25).

`yarn install` may fail behind a corporate npm proxy. The real cause is a **registry mismatch**, not an unavailable package: npm may be pointed at an internal Artifactory mirror by `~/.npmrc` while Yarn reads `registry.yarnpkg.com` from `~/.yarnrc` (Yarn 1 does not read `.npmrc`), and some mirrors 403 the `lodash` tarballs `react-big-calendar` pulls. Fix it in machine-local config only — the root `.gitignore` excludes `.npmrc`/`.yarnrc` deliberately, because a checked-in registry override silently redirects every contributor's installs. Do not create one without the user's explicit consent.

## Backend architecture

### Authorization is a three-layer concern — and it lives in services, not controllers

1. **URL matchers** in `config/auth/SecurityConfiguration.java` — coarse. `permitAll` on `POST /api/auth/{registerDoctor,registerPatient,login}` and `GET /api/{medicine,diseases,specializationDepartments}/**`; `POST /api/calendar/**` and `POST /api/examinations/**` require `ROLE_DOCTOR`; everything else `authenticated()`. Stateless, CSRF off, `@EnableMethodSecurity` on.
2. **`@PreAuthorize` on service methods** — never on controllers. E.g. `CalendarService.createAppointment`, `ExaminationService.examine`, `AuditService.getAllAccessLogs`, `PatientService.listPatients`.
3. **`service/security/AccessGuard.java`** — row-level ownership. Its `require*` methods throw `UnauthorizedActionException` (→403) **and write a `MedicalAccessLog` row as a side effect**. Core rule: a doctor may read a patient only if `scheduledAppointmentRepository.existsByDoctorIdAndPatientId(...)`; a patient may read only their own data. Called from `CalendarService`, `ExaminationService`, `PatientService`, `PatientSummaryService`, `ReportService`, `StatsService`.

When adding an endpoint that touches medical data, put the role check on the service method and call the matching `AccessGuard.require*` — otherwise the access goes unaudited. Audit logging is **explicit only**; there is no AOP/interceptor.

### Auth flow

`RateLimitingFilter` → `JwtAuthenticationFilter` → authorization. JWT subject is the **email** (`User.getUsername()` returns email; there is no username column — removed in `V4`). No role claim in the token — authorities are loaded from the DB per request. `JwtSecretValidator` runs at `@PostConstruct` and only **warns** under the `dev` profile but **throws** (app won't boot) otherwise.

### Entity model

`User` is abstract with `@Inheritance(JOINED)`; `Doctor`, `Patient`, `Admin` are subtypes distinguished by the default `dtype` discriminator. **Role is a function of the Java subtype** — `getRole()` is abstract and hardcoded per subclass, not stored. `Role` enum implements `GrantedAuthority` returning `ROLE_*`.

`Examination`, `Therapy`, `ScheduledAppointment`, `Report` extend `domain/Auditable` (`@MappedSuperclass` with `@CreatedDate`/`@CreatedBy`/etc., enabled via `config/repo/JpaAuditingConfig` whose `AuditorAware` returns the principal's email) **and use soft delete** — `@SQLDelete(... SET deleted = true ...)` + `@SQLRestriction("deleted = false")`. Never hard-delete these.

Object graph: `Doctor`+`Patient` → `ScheduledAppointment` → (1:1) `Examination` → (1:1) `Therapy` → (1:N) `MedicineUsage` → `Medicine`; `Examination` → `Disease`; `Examination` → (1:1) `Report`. **Patient and doctor are reachable only through `scheduledAppointment`** — `Examination` has no direct `patient`/`doctor` field, so queries must traverse `e.scheduledAppointment.patient.id`.

### Conventions to follow

- **DTOs are `record`s**; mapping is fully centralized in `dto/DtoMapper.java` as static methods (no MapStruct). Services return entities; controllers map with `DtoMapper::toXDto`, typically inside `Page.map(...)`. Exception: the `dto/auth/RegisterRequest` hierarchy is a Lombok `@Data` class tree with getters.
- **Error shape** is `exception/ApiError` (status, message, fieldErrors, timestamp) produced by `exception/GlobalExceptionHandler`. `dto/ApiResponse` exists but no controller uses it — don't reach for it.
- **Filtering** uses `repository/specification/*`: `final` classes of static factories that **return `null` when the argument is null/blank**, composed with `Specification.allOf(a, b, c)` (Spring Data 4 idiom) and `findAll(spec, pageable)`. Simple text search instead uses `@Query` JPQL `search(query, pageable)` methods.
- **Paging**: controllers take `@PageableDefault(size = 10) Pageable` and return `Page<XDto>`.
- **Lombok**: `@RequiredArgsConstructor` + `private final` on all beans — no `@Autowired` anywhere. Entities use `@Data` + `@Builder`, with `@EqualsAndHashCode(callSuper = true)` on `Auditable`/`User` subclasses.
- **Jackson is mixed**: runtime mapping uses Boot 4's Jackson 3 (`tools.jackson.databind.ObjectMapper`), while entity/DTO annotations still come from `com.fasterxml.jackson.annotation.*`. Match whichever the surrounding file uses.
- Cross-field validation uses the class-level `validation/@ValidDateRange` (reflection-based, applied to `dto/AppointmentRequest`).

### Schema changes require a migration

`application-dev.properties` sets `spring.jpa.hibernate.ddl-auto=validate` and `spring.sql.init.mode=never`. Hibernate creates/alters nothing and **fails startup on drift**. Any entity change needs a new `src/main/resources/db/migration/V<n>__snake_case_description.sql` (currently V1–V6: initial schema, appointment indexes, medical_access_log, username removal, admin table + seeded default admin, diagnosis/medicine constraint fixes).

**Two underscores after the version — this is load-bearing.** Flyway only recognises `V<version>__<description>.sql`, and by default a file that does not match is *skipped in silence*: no error and no log line. `V6` shipped as `V6_fix_…` and therefore never ran, while `ddl-auto=validate` kept passing because the entities still matched the pre-V6 schema. `spring.flyway.validate-migration-naming=true` is now set so a typo fails the boot instead.

Because the backend CI job boots this profile against an empty MySQL container, `contextLoads()` is really a migration test: it asserts the whole chain produces exactly the schema the entities declare.

### Reference data seeding is manual

`icd10_codes.json` (~8.6 MB), `medicines.json`, `specialization_departments.json` in `src/main/resources` are loaded only by `POST /api/seeder/{disease,medicine,specialization}` (`SeederController` is `@Profile("dev")` and requires auth). Nothing loads at startup. `ValueSet-ndhm-medicine-codes.json` is unused.

### Rate limiting and caching

`config/RateLimitingFilter` (bucket4j) limits **only `/api/auth**`** — 20 requests/minute per `getRemoteAddr()`, in-memory, returns a bare `{"error": ...}` 429 rather than `ApiError`. Caching is `spring.cache.type=simple` with cache names `diseases`, `medicines`, `specializations` — reference data only, no TTL, no patient data.

## Frontend architecture

### Module Federation topology

Each package is a federated remote with `library: { type: 'var' }` and a hardcoded `output.publicPath` of its own port:

| Port | Package | MF name | exposes |
|---|---|---|---|
| 3001 | `home` (shell) | `home` | — |
| 3002 | `icd10` | `icd10` | `./ICD10` |
| 3003 | `nav` | `nav` | `./Header`, `./Footer` |
| 3004 | `examination` | `examination` | `./Examination` |
| 3005 | `shared-store` | `shared_store` | `./store` |
| 3006 | `auth` | `auth` | `./Auth` |
| 3007 | `notifications` | `notifications` | `./Notifications` |
| 3009 | `calendar` | `calendar` | `./Calendar` |

Port 3008 is free. A new remote needs three edits, all in `home`: `webpack.config.js` `remotes`, a `<script>` tag in `public/index.html`, and an entry in `src/routes.js`. Add a `<div id="single-spa-application:NAME">` to `public/index.html` too if it should render in a specific place — single-spa appends its own div to `<body>` otherwise, which is how a remote ends up outside the `.mui-container` layout. Removing a remote means undoing all of these; a stale `login` remote and a dead port-3008 tag lingered because they were only half-removed.

### The shell routes; remotes do not

`packages/home/src/` is three small files and no UI of its own:

- **`routes.js`** — a declarative table, `{ name, load, routes, exceptRoutes?, layout?, public? }`. `routes: ['*']` means every route; `exceptRoutes` subtracts (how the chrome stays off the login screen); `public: true` mounts without a token (only `auth`); `layout: 'full'` opts out of the shell container.
- **`activity.js`** — turns an entry into a single-spa activity function. `matchesRoute` matches on **whole path segments**: bare `startsWith` would make `/calendar` also match `/calendar-archive`. `isAuthenticated` is passed as a *callback*, because the function is re-evaluated on every route change and a captured boolean would be false forever.
- **`index.js`** — registers each entry, loads the theme, and redirects. Redirects run on `single-spa:before-routing-event` (not `routing-event`) so a redirect resolves in the same pass and nothing mounts only to be torn down; plus `AUTH_LOGIN`/`AUTH_LOGOUT` bus listeners, because a logout is a state change and fires no routing event.

Keep routing in the shell. Composition is a property of the whole, so it belongs to the only package that can see the whole — a remote that decided its own routes could not be reasoned about without reading every remote, and two would eventually claim the same path. **The auth gate in `activity.js` is navigation, not security**: it keeps an unauthenticated visitor off an empty screen; the backend enforces access per request in `@PreAuthorize`/`AccessGuard`.

Both split patterns are demonstrated deliberately, and are the architectural point of the project:

- **Vertical split** — `auth` owns the viewport on `/login` and `/register` (`layout: 'full'`, chrome suppressed via `exceptRoutes`), mounted outside `.mui-container`.
- **Horizontal split** — `/examination` composes `icd10` beside `examination` on one screen. They talk only over the event bus (`ICD10_DISEASE_SELECTED`); neither imports the other and either can be redeployed alone.
- **Always-mounted fragments** — the entries with `routes: ['*']`. `nav`'s `header`/`footer` carry an `exceptRoutes` for `/login` + `/register`; `notifications` is the only entry with **no** `exceptRoutes`, because a failed sign-in is precisely the case that needs a toast. That difference in activity function is the reason the toast layer is its own MFE rather than a third application inside `nav` — when two fragments need different route contracts, they are different fragments.

`api-client`, `design-system`, `design-system-react`, `design-system-angular`, `shared-types` have no webpack — they are plain TS libraries consumed via workspace resolution of their `.ts` sources.

### Cross-MFE state

`packages/shared-store/src/` — two module-level singletons deduped across bundles via `globalThis.__MICRO_MEDIC_AUTH_STORE__` / `__MICRO_MEDIC_EVENT_BUS__`:

- **`auth-store.ts`** — closure-based factory (not a class). Hydrates from `localStorage` keys `authToken` / `currentUser`. **Importing it is the bootstrap**: at construction it calls `configureApiClient({ getAuthToken, onUnauthorized })`. Notifies `subscribe()` callbacks *and* emits `AUTH_LOGIN`/`AUTH_LOGOUT` on the event bus.
- **`event-bus.ts`** — typed wrapper over a private `EventTarget`; payloads on `CustomEvent.detail`, keyed by `EventTypes` from `shared-types`.

React bridges the imperative store via `useState` + `authStore.subscribe` (`packages/calendar/src/state/useAuthState.ts`).

### api-client

`packages/api-client/src/` — one lazily created axios instance behind a `httpClient` facade whose verbs already `.then(r => r.data)`, so callers get unwrapped bodies, never `AxiosResponse`. A request interceptor sets `baseURL` per request and injects `Bearer <token>`; a response interceptor converts every failure into `ApiError` (with `.status`, `.data`, and `isUnauthorized`/`isNotFound`/… getters) and fires `onUnauthorized`.

Declare a new domain service with `createService(basePath)` and export a plain object of typed methods — see `packages/calendar/src/services/calendar.service.ts`. Note `baseUrl` defaults to `http://localhost:8080` in `config.ts` and nothing overrides it; there is no env-var hook.

### Design system (Lit) + framework bindings

`packages/design-system/src/components/` defines `mm-button`, `mm-card`, `mm-empty-state`, `mm-error-state`, `mm-input`, `mm-modal`, `mm-select`, `mm-spinner`, `mm-table`, `mm-toast`, `mm-toast-region`. No decorators — each file ends with a `defineElement(tag, Class)` call (a guarded `customElements.define`) plus an `HTMLElementTagNameMap` declaration, so **registration is an import side effect** (`import '@micro-medic/design-system'`). All use `static styles = [baseStyles, css\`...\`]`.

Two gotchas when editing these files: a **backtick inside a comment in a `css`/`html` tagged template terminates the template** (prose in a CSS comment must not use them), and `mm-toast-region` is the one component with an *imperative* API (`show`/`dismiss`/`clear`) rather than a data property — a notification is an event, not state, so a caller holding a `toasts` array would have to prune expired entries itself. The region knows nothing about the event bus; that wiring is the `notifications` MFE's, which keeps this package free of any dependency on `shared-store`.

Beyond components, the package exports the two ways a custom element joins the composition: **`mountDesignSystemParcel`** (`parcel.ts`, a single-spa *parcel* — one element inside an already-mounted app, used by the plain-JS/Svelte MFEs) and **`createCustomElementLifecycles(tag)`** (`lifecycles.ts`, a single-spa *application* whose whole UI is one element — used by `nav` and `notifications`). A custom element's `connectedCallback`/`disconnectedCallback` already *are* single-spa's contract, so the adapter only appends and removes a node; it imports nothing from `single-spa`, which is what lets it serve both the v5 and v6 halves of the repo. `defineElement` is exported for the same reason — an MFE defining its own elements should reuse the guarded registration, not duplicate it.

Any package that renders `mm-*` tags must declare `lit` **and** `@micro-medic/design-system` as federation singletons (see `nav`/`notifications` `webpack.config.js`). The custom element registry is per-*document*: a second copy of the design system finds every tag already defined and its component classes are never used, so whichever remote loaded first silently owns the components.

**CSS scope is the rule that matters here.** Components render into a shadow root, so a global selector cannot reach their internals — a rule like `.mm-btn { … }` in a document stylesheet is unreachable *by construction*, not merely unused. The only ways in from outside are a `--mm-*` custom property (custom properties pierce shadow DOM) or an exported `part`. Every component reads tokens as `var(--mm-token, fallback)`, so a missing theme degrades to defaults rather than breaking.

Two stylesheets, both document-level and **loaded once by the shell**, never by an MFE (two remotes each shipping a reset is the classic micro-frontend collision, and whichever loads second silently wins):

- `src/tokens.css` — the `--mm-*` custom properties on `:root`: colour/status/neutral, typography, spacing, radius, elevation, motion, layout, modal widths, and a **shared z-index scale** (`--mm-z-index-dropdown|sticky|modal|toast`). The z-index scale is shared deliberately: independently deployed MFEs otherwise invent colliding values and one team's modal lands behind another's sticky header.
- `src/global.css` — imports tokens, then the reset, document/element styles, and a small closed set of layout utilities (`.mm-container`, `.mm-region`, `.mm-appbar`, `.mm-stack`, `.mm-row`, `.mm-grid`, `.mm-muted`, `.mm-sr-only`). Its header documents the scope rule; keep component rules out of it.

Per-MFE styles stay in that MFE, namespaced (`calendar/src/styles.css` uses a `cal-block__element` BEM convention) and referencing tokens rather than literal hex.

Framework bindings wrap the same elements — never reimplement a component in a framework:

- `packages/design-system-react/` — `@lit/react`'s `createComponent`, one line per component in `src/components.ts`. Needed because React (through 19) stringifies unknown JSX props onto attributes (`rows={[…]}` → `"[object Object]"`, `open={false}` → truthy `"false"`) and offers no prop for a custom event. Event props: `onClose`, `onCardClick`, `onRowClick`, `onRetry`, `onInput`/`onChange`/`onBlur`. **`create-component.ts`'s `TEvents extends … = {}` default is load-bearing** — `@lit/react` computes props as `Omit<…, keyof TEvents>`, and `keyof {}` is `never` (nothing stripped) whereas `keyof Record<string, never>` is `string` (every prop stripped, breaking every call site). The `no-empty-object-type` disable there is intentional; read the comment before "modernising" it.
- `packages/design-system-angular/` — a `@Directive` per tag, all extending `MmElementDirective` (generic `ngOnChanges` property forwarding; skips `undefined` so the element keeps its own defaults). Selecting on the tag avoids `CUSTOM_ELEMENTS_SCHEMA`, which would disable template type-checking for every unknown tag in the component. `MmInputDirective` implements `ControlValueAccessor` against the composed `mm-input`/`mm-blur` events, so `<mm-input>` works with `ngModel`/`formControlName`. Import `MM_DESIGN_SYSTEM` for all directives at once. In a host listener use `forward(output, $event)` — Angular types `$event` as bare `Event` for non-DOM event names, so `output.emit($event)` fails `strictTemplates`.

`packages/calendar/src/custom-elements.d.ts` declares a blanket `` `mm-${string}` `` JSX index signature — permissive enough that a nonexistent tag still typechecks, which is why the typed bindings are preferable to raw tags. `calendar/src/components/MmFormField.tsx` is the react-hook-form ↔ `MmField` bridge via `useController`.

Verify a binding package with `tsc --noEmit`; for Angular also run `ngc`, since `tsc` alone checks neither host bindings nor template expressions.

### calendar (the reference feature package)

React 19 + TanStack Query 5 + react-hook-form + zod 4 + react-big-calendar. Two entry points:

- **Federated**: `src/Calendar.tsx` exports `bootstrap`/`mount`/`unmount` via `singleSpaReact`.
- **Standalone**: webpack `entry: './src/bootstrap-standalone'`, a one-line dynamic `import('./standalone.js')` used to force an async chunk so the MF shared scope initializes first. `standalone.tsx` creates its own `QueryClient` and a small auth/event debug harness.

Conventions: one hook per file under `hooks/` (`useCalendar`, `useAppointmentMutations`, `usePatientSearch`, `useNavigate`); query keys centralized in `state/query-keys.ts`; every mutation `onSuccess` invalidates `queryKeys.calendar` and emits `NOTIFICATION_SHOW`; zod schemas in `schemas.ts` validate datetime **strings** with object-level `.refine`s carrying explicit `path`s, consumed as `useForm({ resolver: zodResolver(...) })`.

### auth (login + register)

React 19 + react-hook-form + zod 4 — the same stack as `calendar` minus TanStack Query, deliberately: three one-shot commands have nothing to cache, so a `QueryClientProvider` would add a shared singleton for no benefit. `src/Auth.tsx` is the federated entry (`bootstrap`/`mount`/`unmount` via `singleSpaReact`); `src/bootstrap-standalone.ts` → `standalone.tsx` is the dev harness.

`hooks/useAuthActions.ts` holds the one commit point. `complete()` calls `authStore.login(token, user)` — which persists, notifies subscribers *and* emits `AUTH_LOGIN`, so no other MFE needs to be known here — then emits `NOTIFICATION_SHOW` and calls `navigateToUrl(POST_LOGIN_PATH)`. `navigateToUrl`, never `location.assign`: it pushes history and lets single-spa re-evaluate every activity function, whereas a full-page reload would throw away the shared scope. `hooks/useRoute.ts` listens for `single-spa:routing-event` as well as `popstate`, because `pushState` fires no `popstate`.

Registration posts to `POST /api/auth/registerDoctor` or `registerPatient`, whose request bodies are the one place the backend is *not* a `record` — `dto/auth/RegisterRequest` is a Lombok `@Data` class hierarchy. `useSpecializations` fetches the department list rather than hardcoding it (ids are seeder-assigned and differ per environment) and falls back to a plain number field if the fetch fails.

### nav + notifications (native custom elements, no framework)

The two always-mounted fragments. Both are TypeScript custom elements with **no framework runtime and no `single-spa` import** — anything they depended on would be paid for on first paint by every visitor on every screen, and they are also what makes the integration contract falsifiable: lifecycles, the auth store, the event bus, the tokens and the design system are all exercised with no framework to hide behind. Each has a README; read it before changing either.

- **`nav`** (3003, `./Header` + `./Footer`) — `nav-app-bar` and `nav-footer` extend `src/reactive-element.ts`, thirty lines providing the only two things a framework would give here: re-render on state change (`render()` returns the full inner HTML; `requestRender()` coalesces on a microtask) and teardown on disconnect. Deliberate details: **light DOM, not shadow**, because the chrome's job is to *be* the page frame and it wants the shell's `.mm-appbar`; explicit `role="banner"`/`"contentinfo"` since a custom element has no implicit ARIA semantics; **one delegated click listener on the host**, which both survives re-render and sees `<mm-button>`'s composed-and-retargeted internal click via `data-nav-action`; real `<a href>`s with middle/modifier/cross-origin clicks left to the browser; `escapeHtml` on everything interpolated (the user's name crosses a trust boundary); and a skip link targeting `MAIN_LANDMARK_ID`, a contract with the shell's `<main id="mm-main" tabindex="-1">` — the `tabindex` is what makes a fragment link move focus, not just scroll. Sign-out is `<mm-button>`; sign-in stays an `<a>` on purpose (a navigation, not an action). `roles` in `nav-links.ts` is a *presentation* hint, never authorisation.
- **`notifications`** (3007, `./Notifications`) — `notification-center` creates one `<mm-toast-region>` in its constructor, subscribes to `NOTIFICATION_SHOW`, and republishes every removal as `NOTIFICATION_DISMISSED`. It owns exactly two application decisions: the duration table in `src/durations.ts` (`error` sticky, `warning` 8 s, `info` 5 s, `success` 4 s — an emitter's explicit `duration` wins, and `0` is honoured as sticky, hence the `=== undefined` check), and clearing the stack on `AUTH_LOGOUT`, since a toast may name a patient from the session that just ended. It ships **no stylesheet at all** — everything visible is in the region's shadow root — which is the strongest evidence the split with the design system landed correctly.

`connectedCallback` in both tears subscriptions down before re-subscribing: an element moved in the DOM disconnects and reconnects, and a double subscription is the classic "every toast appears twice" bug. Notifications are fire-and-forget by design — one published while the MFE is unmounted is lost, because the bus is a live channel, not a queue.

### shared-types is the contract

`packages/shared-types/src/` — `dtos.ts` (mirrors backend records, incl. `Page<T>`), `enums.ts` (real TS `enum`s: `Role`, `AppointmentStatus`, `ExaminationStatus`, `ReportType`), `events.ts` (`EventTypes` + `EventPayloadMap`). Types only, zero runtime deps, resolved via a `paths` entry in `tsconfig.base.json`. **Backend DTO changes must be mirrored here.**

## State of the code

This is a thesis-stage codebase mid-migration. **Re-verify against the source rather than trusting this list** — it goes stale as work lands.

- **Two eras coexist, and one of them is deliberate.** Legacy plain-JS packages (`home`, `icd10`, `examination`) use single-spa v5, React 18.2, babel-loader, `webpack --watch` + `serve dist`, and call the backend directly with hand-built auth headers. Modern TS packages (`calendar`, `auth`, `nav`, `notifications`, `shared-store`, `api-client`, `design-system`, `design-system-react`, `design-system-angular`, `shared-types`) use TS 6, strict mode, and either React 19 or no framework at all. Four UI systems are in play — MUI CSS via CDN, Svelte 3, Lit, and plain custom elements. **Multi-framework is a goal, not debt**: demonstrating that federation makes it possible is the point of the project, so do *not* port the legacy MFEs to React 19. What *is* debt is the hand-rolled HTTP/auth code in them; port that toward `api-client` and `shared-store`.
- **Finished features: `calendar`, `auth`, `nav`, `notifications`.** `icd10` and `examination` are placeholders to be implemented later. The foundation packages (`api-client`, `shared-store`, `shared-types`, all three design-system packages) are done. **Nothing consumes `design-system-angular` yet** — the next planned MFE is an Angular one that exercises it, and no Vue package exists (Vue is entirely absent from `node_modules`).
- **All eight webpack packages build, and `eslint .` is clean.** The Babel clash that once broke `home`/`icd10` is fixed by the `resolutions: { "@babel/core": "^7.29.7" }` pin — babel-loader resolves `@babel/core` from the hoisted root, and `@babel/preset-react` 7 throws on 8.x. If a build suddenly fails with `Requires Babel "^7.0.0-0", but was loaded with "8.x"`, the on-disk tree has drifted from the lockfile; re-run `yarn install` rather than editing the pin. `calendar` and `auth` build with asset-size warnings, which is expected.
- **`node_modules/@micro-medic/` has no symlink for `design-system-angular` or the `notifications` workspace**, and `node_modules/search` is a stale symlink from `nav`'s old package name. Nothing breaks, because resolution goes through the `paths` map in `tsconfig.base.json`; only `yarn install` will tidy it.
- **`calendar` is wired end to end.** `CalendarApp.tsx` composes `components/` with the `state/`/`hooks/` modules; `Calendar.tsx` builds its own `QueryClient` at module scope. Event titles are role-aware (`utils/map-events.ts` takes the viewer's `Role` and labels each event with the *counterpart*), the detail pane derives its DTO from the query cache by id so it cannot show a stale snapshot after a mutation, and selecting an event emits `CALENDAR_APPOINTMENT_SELECTED`.
- **`auth` is the login/register MFE** (port 3006, exposes `./Auth`), the vertical-split example. It is the only `public: true` feature route, and the only thing that populates `authStore` — previously nothing did, so a token could only arrive by hand-writing `localStorage`.
- **`nav` and `notifications` are implemented and framework-free** (see their section above). The chrome is no longer legacy React 18. `notifications` is the consumer `--mm-z-index-toast` had been waiting for, and the shell now owns a `<main id="mm-main" tabindex="-1">` landmark that nav's skip link targets.
- **The blanket `` `mm-${string}` `` JSX index signature in `calendar/src/custom-elements.d.ts` is why a nonexistent tag typechecks.** It previously hid a `<mm-field>` the design system never defined. Prefer the typed bindings over raw tags.
- **No tests.** `api-client` and `shared-store` declare `"test": "jest"` but there are no test files, no jest config, and `shared-store` has no jest dependency. The backend has one `contextLoads()`. Test infrastructure is deliberately deferred; lint + typecheck + build are the automated checks today.
- **Known backend defects.** Much of the earlier list is fixed: `ValidDateRange` declares `groups()`, `GET /api/therapies` requires `ROLE_ADMIN`, `CalendarService.cancel` authorises via `requireAppointmentAccess`, both booking paths reject overlaps, `ReportService.getByExaminationId` authorises against the report it returns, `AccessGuard` has an `isAdmin` bypass, `MedicineForm` has all 18 constants, `StatsService` fills `PatientStatsDto`/`DiagnosisCountDto` correctly, `SpecializationService` reads the right filename, all three seeders dedup with a single batched query instead of an O(n²) scan (`findAllById` for diseases/medicines, `findByNameIn` for specializations), `PdfGenerationService` emits PDF bytes by hand — `%PDF-1.4` header, Type1 Helvetica font objects, xref table and trailer — so it needs no library on the classpath, and V6 drops the `examination.diagnosis` unique constraint plus the `medicine` UNIQUE/NOT NULL constraints that `medicines.json` violated. Audit writes now go through `MedicalAccessRecorder` with `Propagation.REQUIRES_NEW`, which is what makes them flush from `readOnly = true` read paths — note that method must **not** itself be `readOnly`, since that flag is what sets `FlushMode.MANUAL`. Still open:
  - `DoctorController` is mapped at `/api/doctor` (singular) while every sibling collection controller is plural (`/api/patients`, `/api/medicines`, `/api/reports`).
  - `spring.flyway.validate-migration-naming=true` is now set, and it earns its place: `V6` shipped as `V6_fix_...` with a single underscore, which Flyway *silently skips* — no error, no log line, and `ddl-auto=validate` still passed because the entities matched the pre-V6 schema. A misnamed migration must fail the boot, not the database. Watch for this whenever adding a migration.
