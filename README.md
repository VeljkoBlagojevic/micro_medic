# micro_medic — multi-framework micro-frontend medical application

A single-spa shell with webpack Module Federation remotes for doctors to schedule appointments, record examinations, search ICD-10 codes, and manage patient data. The Spring Boot monolith backend (in `../micro_medic_monolith_backend`) serves the API at `http://localhost:8080`.

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Frameworks & Design Systems](#frameworks--design-systems)
- [Micro-Frontend Remotes](#micro-frontend-remotes)
- [Design System Components](#design-system-components)
- [Tooling & Configuration](#tooling--configuration)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)

---

## Getting Started

### Prerequisites

- Node.js 20+ with Yarn
- Backend API running at `http://localhost:8080` (start the monolith first)

### Quick Start

```sh
yarn install
yarn start        # builds every package + serves remotes on their ports
```

Open [http://localhost:3001](http://localhost:3001) — the `home` shell. Start the backend first, otherwise requests fail with `ApiError`. You will land on `/login`; the shell redirects there whenever there is no token.

### Useful Commands

```sh
yarn verify                         # lint + typecheck + build — what CI runs
yarn lint                           # eslint across every package
yarn typecheck                      # every package that has a tsconfig
yarn build                          # every package
yarn workspace <package> start      # single package development
yarn workspace calendar typecheck   # typecheck just one package
npx ngc -p packages/design-system-angular/tsconfig.json --outDir ./dist-ngc  # Angular template checks
```

---

## Architecture Overview

### Single-spa + Module Federation

The application uses **single-spa** for shell orchestration and **webpack Module Federation** for remote composition. Each feature micro-frontend is a standalone micro-frontend that:

- Renders on a specific route or routes
- Exposes a federated entry point (e.g., `./Examination`)
- Can be deployed independently of siblings
- Communicates via event bus (`@micro-medic/shared-bus`) and shared store

### Port Assignments

Remote packages load from hardcoded ports. Adding a remote requires:

1. Update the `REMOTES` map in `home/webpack.config.js` (entries are `name@url`)
2. Add an entry to `home/src/routes.ts`
3. Optionally add `<div id="single-spa-application:NAME">` for specific mounting

| Port | Package    | MF name      | Exposes                      | Framework       |
|------|------------|--------------|------------------------------|-----------------|
| 3001 | `home`     | shell        | —                            | Vanilla TS      | [[Read more]](/micro_medic_microfrontend/packages/home/README.md) |
| 3002 | `icd10`    | ICD-10 search| `./ICD10`                    | Vue 3           | [[Read more]](/micro_medic_microfrontend/packages/icd10/README.md) |
| 3003 | `nav`      | chrome       | `./Header`, `./Footer`       | Native CE (Lit) | [[Read more]](/micro_medic_microfrontend/packages/nav/README.md) |
| 3004 | `examination`| exam record | `./Examination`              | Angular 22      | [[Read more]](/micro_medic_microfrontend/packages/examination/README.md) |
| 3006 | `auth`     | authentication| `./Auth`                    | React 19        | [[Read more]](/micro_medic_microfrontend/packages/auth/README.md) |
| 3007 | `notifications` | toast layer | `./Notifications`          | Native CE (Lit) | [[Read more]](/micro_medic_microfrontend/packages/notifications/README.md) |
| 3009 | `calendar` | calendar     | `./Calendar`                 | React 19        | [[Read more]](/micro_medic_microfrontend/packages/calendar/README.md) |

> **Ports 3005 and 3008 are free** (formerly used by `shared-store` as a federated remote when the shell was plain JS; now the shell is TypeScript and imports from source directly).

### Communication Patterns

- **Event Bus**: `@micro-medic/shared-bus` for decoupled event emission/subscription
- **Shared Store**: `@micro-medic/shared-store` - frozen read-only view of auth state
- **URL-based handoffs**: `?appointmentId=` parameter for cross-MFE navigation
- **Design System**: `@micro-medic/design-system` - shared Lit custom elements
- **Design System**: `@micro-medic/design-system` - shared Lit custom elements

---
- 🎨 **React 19** — `calendar`, `auth` (MUI, react-hook-form) — [[Read more]](/micro_medic_microfrontend/packages/calendar/README.md)
- ⚛️ **Angular 22** — `examination` (standalone components, signals, zoneless, AOT) — [[Read more]](/micro_medic_microfrontend/packages/examination/README.md)
- 💚 **Vue 3** — `icd10` (SFCs, Composition API) — [[Read more]](/micro_medic_microfrontend/packages/icd10/README.md)
- 🧱 **Native Custom Elements (Lit)** — `nav`, `notifications` (no framework runtime) — [[Read more]](/micro_medic_microfrontend/packages/nav/README.md), [[Read more]](/micro_medic_microfrontend/packages/notifications/README.md)

## Frameworks & Design Systems

### Multi-Framework Thesis

**Multiple frameworks coexisting is intentional**. The project demonstrates that federation makes it possible to compose:

- 🎨 **React 19** — `calendar`, `auth` (MUI, react-hook-form)
- ⚛️ **Angular 22** — `examination` (standalone components, signals, zoneless, AOT)
- 💚 **Vue 3** — `icd10` (SFCs, Composition API)
- 🧱 **Native Custom Elements (Lit)** — `nav`, `notifications` (no framework runtime)
- ⚡ **@lit/** library — design system components

> This is a deliberate choice: demonstrating that composition boundaries at the *browser* (custom elements, DOM events, localStorage) rather than shared builds. Angular and Vue on one screen proves neither can import the other's components even in principle.

### Design System Components

The `@micro-medic/design-system` provides a shared set of Lit custom elements used across all frameworks:

- `<mm-button>` — variants: primary, secondary, etc.
- `<mm-modal>` — with configurable slots (header, footer)
- `<mm-input>` — text input with validation, label, error states
- `<mm-select>` — select/datalist with options
- `<mm-table>` — accessible data table with row actions
- `<mm-card>` — container card component
- `<mm-spinner>` — loading indicator
- `<mm-toast>` / `<mm-toast-region>` — toast notifications
- `<mm-error-state>` — error handling UI

#### Framework Bindings

Three binding packages exist to address specific framework needs:

| Package | Purpose | Why Needed |
|---------|---------|------------|
| `@micro-medic/design-system-react` | React wrappers | Custom events have no JSX prop (React 19 fixed stringification bug, but events still need binding) |
| `@micro-medic/design-system-angular` | Angular directives | Need `CUSTOM_ELEMENTS_SCHEMA` workaround; directive-based type checking for props |
| `@micro-medic/design-system-vue` | Vue types | Declares `GlobalComponents` interface in `compilerOptions.isCustomElement` |
| *(None)* | Vue runtime | Vue 3 handles custom elements natively with no adapter needed |

**There is deliberately no `design-system-vue`** — Vue has neither defect that the other frameworks have, so the glue cost is zero for runtime (just a type interface). This reframes the binding packages as *compensation for framework defects* rather than per-framework tax.

**There is deliberately no `design-system-vue`** — Vue has neither defect that the other frameworks have, so the glue cost is zero for runtime (just a type interface). This reframes the binding packages as *compensation for framework defects* rather than per-framework tax.

---

### Auth (`auth` micro-frontend) — Port 3006 [[[Read more]](/micro_medic_microfrontend/packages/auth/README.md)](packages/auth/README.md)
## Micro-Frontend Remotes

### Auth (`auth` micro-frontend) — Port 3006

**Purpose**: Authentication and user registration. Owns `/login` and `/register` routes.

**Why it's its own MFE**:
- **Vertical split pattern**: One team-sized slice owning authentication end-to-end
### Examination (`examination` micro-frontend) — Port 3004 [[[Read more]](/micro_medic_microfrontend/packages/examination/README.md)](packages/examination/README.md)
- **Nothing else can authenticate**: All other MFEs read the *result* (`authContext`, `AUTH_LOGIN` event), not implement login logic
- **Deployable alone**: Auth changes ship without rebuilding calendar/examination

**What it publishes**:
- `authStore.login()` — persists token, notifies subscribers, emits `AUTH_LOGIN`
- `NOTIFICATION_SHOW` — for failed login toasts (emitted and forgotten)

**API endpoints used**:
- `/api/auth/**` — login/register operations
- `/api/auth/registerPatient`, `/api/auth/registerDoctor` — registration endpoints
- `/api/specializationDepartments` — populate specialization dropdown

### Examination (`examination` micro-frontend) — Port 3004

**Purpose**: Recording examinations: anamnesis, diagnosis, therapy, prescribed medicines.

### ICD-10 Search (`icd10` micro-frontend) — Port 3002 [[[Read more]](/micro_medic_microfrontend/packages/icd10/README.md)](packages/icd10/README.md)
**Framework**: Angular 22 with standalone components, signals, zoneless, AOT-compiled

**Why Angular**:
1. Only consumer of `design-system-angular` (proves the binding package exists)
2. Demonstrates multiple frameworks in one application
3. Reactive forms fit this form-heavy use case better than Zod

**The split**: Horizontal screen split with examination (3/4 width) and ICD-10 catalogue (1/4 width). The 3:1 ratio is in `.mm-split--primary` design system token, applied by shell.

**Outbound events**:
- `EXAMINATION_COMPLETED` — signals exam finished
- Handoff from calendar arrives via URL (`?appointmentId=`), not event bus
### Navigation (`nav` micro-frontend) — Port 3003 [[[Read more]](/micro_medic_microfrontend/packages/nav/README.md)](packages/nav/README.md)

### ICD-10 Search (`icd10` micro-frontend) — Port 3002

**Purpose**: Search ~71,700 ICD-10 codes, select diagnosis, publish to examination form.

**Framework**: Vue 3 SFCs with Composition API

**Why Vue, why no `design-system-vue`**:
Vue has neither defect that requires binding glue:
1. Sets non-primitive bindings as DOM **properties** (not attributes)
2. Registers custom events via `addEventListener` out of the box

This makes the project's glue cost spectrum optimal: nothing for plain elements, one predicate for Vue, one package for React, eleven directives for Angular.
### Notifications (`notifications` micro-frontend) — Port 3007 [[[Read more]](/micro_medic_microfrontend/packages/notifications/README.md)](packages/notifications/README.md)

### Navigation (`nav` micro-frontend) — Port 3003

**Purpose**: Application chrome (top app bar + page footer).

**Why no framework**:
- Mounted on **every route**, so any runtime is paid for on first paint by every visitor
- Only needs ~30 lines of reactive element machinery
- Makes integration contract falsifiable: single-spa lifecycles, event bus, design system demonstrated with no framework hiding behind it

**Attributes in, events out**:
- Session as attributes (no shared state dependency)
- Sign-out via bubbling `nav:sign-out` event
- No framework runtime at all

### Notifications (`notifications` micro-frontend) — Port 3007

**Purpose**: Application-wide toast layer. Subscribes to `NOTIFICATION_SHOW` and renders into `<mm-toast-region>`.
### Calendar (`calendar` micro-frontend) — Port 3009 [[[Read more]](/micro_medic_microfrontend/packages/calendar/README.md)](packages/calendar/README.md)

**Why separate MFE from nav**:
- Chrome suppressed on `/login` and `/register` (except routes in shell)
- Failed-login toast needs different activity function
- Own deploy cadence rather than inheriting header's

**Duration policy**:
| Type | Duration | Notes |
|------|----------|-------|
| error | until dismissed | Sticky failures |
| warning | 8s | Auto-dismiss |
| info | 5s | Auto-dismiss |
| success | 4s | Auto-dismiss |

**Fire-and-forget**: Notifications published while unmounted are lost (live channel, not queue). `NOTIFICATION_DISMISSED` emitted for removal correlation. `AUTH_LOGOUT` clears stack via `clear()`.

### Calendar (`calendar` micro-frontend) — Port 3009

**Purpose**: Appointment calendar view and management.

**Framework**: React 19 with MUI and react-hook-form

**What it publishes**:
- `NOTIFICATION_SHOW` — mutation notifications
- `EXAMINATION_COMPLETED` — when recording exam from calendar click
- Calendar handoff to examination via URL, not event bus


---

## Tooling & Configuration

### ESLint

Single flat config (`eslint.config.mjs`) for the whole monorepo:
- Layered: "everything → TypeScript → React → exceptions → prettier"
- Type-aware linting enabled for `.ts`/`.tsx` (enables `no-floating-promises`)
- Some rules deliberately off with documented reasons:
  - `unbound-method` — fights Lit's event-binding contract
  - Object literal `{}` in `create-component.ts` — load-bearing (`keyof {}` is `never`)

### Prettier

**Report-only mode**: Config governs new/touched files only. ~86 pre-existing files not reflowed, so `format:check` is outside `verify` and non-blocking in CI. Run `yarn format` separately to enable formatting checks.

---

## Project Structure

```
micro_medic_microfrontend/
├── README.md              # This file
├── package.json           # Workspace root config
├── tsconfig.base.json     # Shared TypeScript paths
├── eslint.config.mjs      # Flat ESLint config
├── home/                  # Shell application
│   ├── webpack.config.js  # Module Federation remotes map
│   ├── src/
│   │   ├── routes.ts     # MFE route table
│   │   └── index.ts      # Shell entry
│   └── public/index.html # Shell page
├── packages/
│   ├── api-client/       # Shared HTTP client & config
│   ├── auth/             # React 19 authentication
│   ├── calendar/         # React 19 calendar
│   ├── design-system/    # Core Lit custom elements
│   ├── design-system-angular/  # Angular bindings
│   ├── design-system-react/   # React bindings
│   ├── examination/      # Angular 22 examination recording
│   ├── icd10/            # Vue 3 ICD-10 search
│   ├── nav/              # Native CE chrome (header/footer)
│   ├── notifications/    # Native CE toast layer
│   ├── shared-bus/       # Event bus singleton
│   ├── shared-store/     # Auth store singleton
│   └── shared-types/     # Backend DTOs, enums, event payloads
├── thesis/               # Analysis documents (optional)
└── .github/workflows/    # CI workflows
```

---

## Contributing Guidelines

### Adding a Micro-frontend

1. Follow the "Building a New Package" workflow
2. Update `tsconfig.base.json` paths if adding library dependencies
3. Add route to shell's routes table
4. Configure webpack singleton shares for federation
5. Document in package README with stack, ports, and integration surface

### Adding Design System Components

1. Extend appropriate Lit component class
2. Define reactive properties using Lit's declarative API
3. Generate framework bindings per adapter pattern
4. Add to barrel exports and design system provider
5. Style via custom properties (shadow encapsulation)

### Porting Between Frameworks

- Preserve the contract: events, URL handoffs, shared state patterns
- Don't consolidate frameworks — demonstrate federation's power instead
- Each port proves architecture works across boundaries

---

*This project demonstrates that Module Federation enables multi-framework composition at the browser boundary, with each framework owning its own build, deployment, and development pipeline.*

---

## Notes & Gotchas

### Package Lock Files

Both `yarn.lock` and `package-lock.json` are checked in. Workspace tooling (`wsrun`, `yarn workspaces`) is Yarn's — use Yarn; treat `package-lock.json` as stale for npm users.

### Corporate Proxies

`yarn install` may fail behind corporate npm proxies due to registry mismatch:
- `~/.npmrc` may point npm at internal mirror
- Yarn reads `registry.yarnpkg.com` from `~/.yarnrc`
- Some mirrors 403 `lodash` tarballs that `react-big-calendar` pulls
- Fix in machine-local config; root `.gitignore` excludes `.npmrc`/`.yarnrc`

### No Tests (Currently)

No package declares a `test` script. Test infrastructure is deferred; lint + typecheck + build are the automated checks today. This is intentional to avoid false positives from hand-written tests without proper framework.

### Every Package is TypeScript

All packages now use TypeScript, including the shell (`home`). Porting `home` removed:
- The last `babel-loader` dependency
- Federated `shared_store` remote (now imports from source via paths map)
- Legacy plain-JS container patterns

### Multiple Frameworks is Intentional

Don't try to consolidate frameworks. This project's thesis is that federation enables composition at the browser boundary. Porting features between frameworks proves the architecture holds:
- `/examination` (Angular) and `/examination`-narrow pane (Vue) share screen
- Calendar and auth can be independently deployed and changed
- Each framework only knows about what the other exposes via events/URLs

### Running Standalone

Each MFE has a standalone harness for development:

```sh
yarn workspace auth start           # webpack --watch
yarn workspace auth serve           # serve dist -p 3006
yarn workspace calendar typecheck   # vue-tsc / tsc as appropriate
```

Standalone pages are in `public/index.html` with buttons that navigate to routes and read out bus events.

### Backend Requirements

A running backend at `http://localhost:8080` is required for full functionality. Configure in `packages/*/src/api-client/src/config.ts`. The backend serves:
- Authentication endpoints (`/api/auth/**`)
- Registration endpoints (`/api/auth/register*`)
- Specialization departments (`/api/specializationDepartments`)
- Examination CRUD, medicines, appointments
- ICD-10 disease codes (seed via `/api/seeder/disease` in dev profile)


---

## Deployment

### Module Federation Configuration

Each MFE shares:
- `@micro-medic/design-system` — singleton
- `@micro-medic/shared-store` — singleton  
- `@micro-medic/shared-bus` — singleton
- Framework-specific dependencies (`react`, `angular`, `vue`) as needed

Webpack config ensures only one copy of shared dependencies transit the boundary.

### Remote Entry Points

- `packages/auth/src/Auth.tsx`
- `packages/calendar/src/Calendar.tsx`
- `packages/design-system-angular/src/index.ts` (Angular)
- `packages/design-system-react/src/components.ts` (React)
├── api-client/       # Shared HTTP client & config [[Read more]](/micro_medic_microfrontend/packages/api-client/README.md) |
│   ├── auth/             # React 19 authentication [[Read more]](/micro_medic_microfrontend/packages/auth/README.md) |
- `packages/examination/src/Examination.ts`
├── calendar/         # React 19 calendar [[Read more]](/micro_medic_microfrontend/packages/calendar/README.md) |
│   ├── design-system/    # Core Lit custom elements [[Read more]](/micro_medic_microfrontend/packages/design-system/README.md) |
├── design-system-angular/  # Angular bindings [[Read more]](/micro_medic_microfrontend/packages/design-system-angular/README.md) |
│   ├── design-system-react/   # React bindings [[Read more]](/micro_medic_microfrontend/packages/design-system-react/README.md) |
├── examination/      # Angular 22 examination recording [[Read more]](/micro_medic_microfrontend/packages/examination/README.md) |
│   ├── icd10/            # Vue 3 ICD-10 search [[Read more]](/micro_medic_microfrontend/packages/icd10/README.md) |
├── nav/              # Native CE chrome (header/footer) [[Read more]](/micro_medic_microfrontend/packages/nav/README.md) |
│   ├── notifications/    # Native CE toast layer [[Read more]](/micro_medic_microfrontend/packages/notifications/README.md) |
- `packages/icd10/src/ICD10.ts`
├── shared-bus/       # Event bus singleton [[Read more]](/micro_medic_microfrontend/packages/shared-bus/README.md) |
│   ├── shared-store/     # Auth store singleton [[Read more]](/micro_medic_microfrontend/packages/shared-store/README.md) |
└── shared-types/     # Backend DTOs, enums, event payloads [[Read more]](/micro_medic_microfrontend/packages/shared-types/README.md)
```

## Related Documentation

For detailed information about each package, see the individual README files:

| Package | Description | Read More |
|---------|-------------|-----------|
| [`packages/home/README.md`](packages/home/README.md) | Shell application overview and routes | [[View]](packages/home/README.md) |
| [`packages/auth/README.md`](packages/auth/README.md) | Authentication micro-frontend details | [[View]](packages/auth/README.md) |
| [`packages/calendar/README.md`](packages/calendar/README.md) | Calendar MFE with React 19 | [[View]](packages/calendar/README.md) |
| [`packages/design-system/README.md`](packages/design-system/README.md) | Core design system components | [[View]](packages/design-system/README.md) |
| [`packages/design-system-angular/README.md`](packages/design-system-angular/README.md) | Angular bindings guide | [[View]](packages/design-system-angular/README.md) |
| [`packages/examination/README.md`](packages/examination/README.md) | Examination recording with Angular | [[View]](packages/examination/README.md) |
| [`packages/icd10/README.md`](packages/icd10/README.md) | ICD-10 search with Vue 3 | [[View]](packages/icd10/README.md) |
| [`packages/nav/README.md`](packages/nav/README.md) | Navigation chrome details | [[View]](packages/nav/README.md) |
| [`packages/notifications/README.md`](packages/notifications/README.md) | Toast layer MFE | [[View]](packages/notifications/README.md) |

---

*This project demonstrates that Module Federation enables multi-framework composition at the browser boundary, with each framework owning its own build, deployment, and development pipeline.*
- `packages/nav/Header.ts`, `packages/nav/Footer.ts`
- `packages/notifications/Notifications.ts`
- `packages/shared-bus/src/index.ts`

### CI/CD

Two GitHub Actions workflows:
- `frontend.yml`: lint + typecheck, build every MFE
- `backend.yml`: build monolith against MySQL container with Flyway chain


---

## Development Workflow

### Building a New Package

1. Create new package directory under `packages/`
2. Copy template from existing similar package (`calendar`, `auth`)
3. Update `webpack.config.js` with:
   - Singleton share configuration for dependencies
   - Entry point definitions
4. Add route to `home/src/routes.ts`
5. Add remote to `home/webpack.config.js` REMOTES map
6. Optionally add `<div id="single-spa-application:NAME">` if specific mounting needed

### Adding a Design System Component

1. Create component class extending Lit's `LitElement`
2. Define reactive properties with `state()` or `hostBindings`
3. Generate bindings in appropriate adapter package:
   - React: Add to `src/components.ts` using `createComponent()`
   - Angular: Extend `MmElementDirective<TElement>`
   - Vue: Handle via compiler option `isCustomElement: tag => tag.startsWith('mm-')`
4. Export from barrel file in design system package

### CSS Guidelines

- Per-MFE styles must be namespaced
- Reference tokens, not literal colors
- Nothing can style internal shadow root elements directly
- Document-wide theme is **not** duplicated by remotes (classic collision)


### TypeScript Configuration

- Root `tsconfig.base.json` defines paths map for library imports
- Every feature MFE can import `@micro-medic/*` packages directly as sources
- `shared-store` no longer needs federated remote (shell is now TS)

### Angular Template Checking

`tsc` alone doesn't check Angular template expressions. Run:
```sh
npx ngc -p packages/design-system-angular/tsconfig.json --outDir ./dist-ngc
```

### Vue Template Checking

Use `vue-tsc` for `.vue` files:
```sh
yarn workspace icd10 typecheck  # vue-tsc --noEmit
```

Include `.vue` in `tsconfig.json`'s `include` pattern so templates are checked.

- Calendar handoff to examination via URL, not event bus

---

## Design System Components

### Component Inventory

The design system provides shared Lit custom elements:

| Component | Description | Common Props |
|-----------|-------------|--------------|
| `<mm-button>` | Button with variants (primary, secondary, etc.) | `variant`, `label`, `loading`, `disabled` |
| `<mm-modal>` | Modal dialog with configurable slots | `open`, `heading`, `dismissible` |
| `<mm-input>` | Text input with validation | `label`, `value`, `error`, `multiline`, `rows` |
| `<mm-select>` | Select/datalist dropdown | `label`, `options`, `value`, `placeholder` |
| `<mm-table>` | Accessible data table | `columns`, `rows`, `clickable` |
| `<mm-card>` | Container card component | `heading`, `dismissible` |
| `<mm-spinner>` | Loading indicator | `label`, `size` |
| `<mm-toast>` | Toast notification message | `message`, `type`, `duration` |
| `<mm-toast-region>` | Toast container region | — |
| `<mm-error-state>` | Error handling UI component | — |

### Styling Strategy

- **Document-wide theme** (`tokens.css` + `global.css`) loaded once by shell
- Per-MFE styles namespaced (e.g., `exam-*`, `calendar-*`)
- CSS tokens (`var(--mm-token)`) preferred over literal hex values
- Shadow root encapsulation: only custom properties pierce shadow boundaries

### Custom Properties

Use these design system tokens in your styling:

```css
:root {
  --mm-primary: /* primary color */;
  --mm-secondary: /* secondary color */;
  --mm-text-on-background: /* text colors */;
  --mm-divider-color: /* divider colors */;
  --mm-header-height: header height pinning;
  --mm-z-index-toast: toast stacking level;
}
```

### Framework Bindings

Three binding packages exist for different framework needs:

| Package | Purpose | Why Needed |
|---------|---------|------------|
| `@micro-medic/design-system-react` | React wrappers | Custom events have no JSX prop (React 19 fixed stringification bug, but events still need binding) |
| `@micro-medic/design-system-angular` | Angular directives | Need `CUSTOM_ELEMENTS_SCHEMA` workaround; directive-based type checking for props |
| `@micro-medic/design-system-vue` | Vue types | Declares `GlobalComponents` interface in `compilerOptions.isCustomElement` |
| *(None)* | Vue runtime | Vue 3 handles custom elements natively with no adapter needed |

**There is deliberately no `design-system-vue`** — Vue has neither defect that the other frameworks have, so the glue cost is zero for runtime (just a type interface). This reframes the binding packages as *compensation for framework defects* rather than per-framework tax.

