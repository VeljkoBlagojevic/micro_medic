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
otherwise every request fails with a network `ApiError`.

```sh
yarn build                          # all packages
yarn typecheck                      # all packages that have a tsconfig
yarn workspace calendar typecheck   # just one
```

## Packages

Remotes are loaded from hardcoded ports, so the port a package serves on is part of the contract
(`packages/home/public/index.html` and each `webpack.config.js` `remotes` map).

| Port | Package | MF name | Exposes |
|---|---|---|---|
| 3001 | `home` (shell) | `home` | — |
| 3002 | `icd10` | `icd10` | `./ICD10` |
| 3003 | `nav` | `nav` | `./Header`, `./Footer` |
| 3004 | `examination` | `examination` | `./Examination` |
| 3005 | `shared-store` | `shared_store` | `./store` |
| 3009 | `calendar` | `calendar` | `./Calendar` |

Library packages have no webpack and no build step — they are consumed as TypeScript sources
through the `paths` map in `tsconfig.base.json`:

- `shared-types` — the backend contract: DTOs, enums, event payloads. Mirror any backend DTO
  change here first.
- `api-client` — one axios instance behind `httpClient`; `createService(basePath)` per domain.
- `shared-store` — `authStore` and `eventBus`, deduped across bundles via `globalThis`.
- `design-system` — Lit elements (`mm-button`, `mm-modal`, …); registration is an import side effect.
- `design-system-react` — React bindings for those elements, generated with `@lit/react`.

The design system is implemented **once, in Lit**, with a thin binding layer per framework —
React consumers import `@micro-medic/design-system-react`, while the plain-JS and Svelte MFEs
use the tags directly or the single-spa parcel in `design-system/src/parcel.ts`. See
`packages/design-system-react/README.md` for why the wrapper is necessary (React sets unknown
props as stringified attributes and cannot subscribe to custom events).

Importing `shared-store` is also the api-client bootstrap: `auth-store.ts` calls
`configureApiClient({ getAuthToken, onUnauthorized })` at construction.

## Notes

- Both `yarn.lock` and `package-lock.json` are checked in. The workspace tooling (`wsrun`,
  `yarn workspaces`) is Yarn's — use Yarn and treat `package-lock.json` as stale.
- No linter, no tests.
- Legacy packages (`home`, `nav`, `icd10`, `examination`) are plain JS on single-spa v5 / React 18
  and still call a stale `/api/v1/...` prefix. Port toward the TypeScript packages rather than
  extending them.
