# auth

The authentication micro-frontend. Owns `/login` and `/register`, and is the only package that
calls `/api/auth/**` or writes to the auth store.

| | |
|---|---|
| Port | 3006 |
| MF name | `auth` |
| Exposes | `./Auth` |
| Stack | React 19, react-hook-form, zod 4, `@micro-medic/design-system-react` |

## Why it is its own micro-frontend

It is the textbook **vertical split**: one team-sized slice that owns a feature end to end — its
own routes, its own UI, its own backend endpoints — rather than a horizontal layer shared by
everyone. Two properties follow from that, and both are the point:

- **Nothing else can authenticate.** Every other MFE reads the *result* — `authContext`, the shared
  store's frozen read-only view, or the `AUTH_LOGIN` event — and none of them knows how a token is
  obtained. That is enforced rather than agreed: `authContext` has no `login` or `logout` on it, so
  `useAuthActions` in this package and nav's sign-out button are the only code in the monorepo that
  imports `authStore` itself. Move to OAuth tomorrow and this package is the only one that changes.
- **It can be deployed alone.** A change to the login form ships without rebuilding the calendar.

The brand panel beside the form is part of *this* MFE, not a second one. Splitting it out would
be the anti-pattern: two deployables that can never be released independently, because neither
half is a usable screen on its own.

## Routing

The shell decides *whether* this MFE is mounted (its single-spa activity function matches
`/login` and `/register`); `useRoute` decides *which of the two* is shown.

That division matters. A second history-owning router inside a remote fights single-spa over
`popstate`, so this package deliberately has no router — just a `location.pathname` read kept in
sync with `single-spa:routing-event` (fired after every single-spa navigation, including the
`pushState` ones `popstate` misses).

Navigation out is `navigateToUrl` from `single-spa`: it pushes history and lets the shell
re-evaluate every activity function, which unmounts this MFE and mounts the destination. A
`location.assign` would full-page reload and throw away the shared scope.

`AuthApp` also redirects an already-authenticated visitor away from `/login`. The shell guards
the reverse direction (an unauthenticated visitor on a protected route); this side belongs here,
because only this package knows what "already signed in" should mean.

## What it publishes

Nothing bespoke — the whole integration surface is `authStore.login()`, which persists the token,
notifies subscribers, *and* emits `AUTH_LOGIN` on the event bus. That single call is what every
sibling reacts to, which is why this package needs no knowledge of who they are.

`NOTIFICATION_SHOW` is also emitted, and consumed by the `notifications` MFE (:3007). This package
does not know that: it emits and forgets, which is why a failed sign-in can raise a toast even
though the chrome is switched off on `/login` — the toast layer has its own activity function that
covers the auth routes.

## Forms

One `useForm` for registration, with `role` as a field inside it rather than two schemas behind a
toggle. Two schemas would mean two form instances — so switching role would discard everything
already typed — and "specialization is required, but only for doctors" is a cross-field rule,
which is exactly what a `.refine` with an explicit `path` expresses.

`schemas.ts` mirrors the backend's Bean Validation constraints so the user finds out before the
round trip. Two spellings to watch:

- `RegisterRequest` uses **`firstName`/`lastName`** (capital N), unlike the `firstname`/`lastname`
  on every response DTO. Sending the lowercase form leaves both null and trips `@NotBlank`.
- The register paths are camelCase: `/api/auth/registerPatient`, `/api/auth/registerDoctor`.

`specializationId` comes from `GET /api/specializationDepartments` rather than a hardcoded list —
the table is populated by `POST /api/seeder/specialization`, so ids differ per environment. If
that request fails the form degrades to a numeric id field instead of blocking registration.

## Error messages

`utils/error-message.ts` maps `ApiError` to user-facing text. One deliberate choice: a failed
login never distinguishes "no such account" from "wrong password", because saying which would let
an attacker enumerate registered email addresses. It also handles 429 — `RateLimitingFilter`
allows 20 requests/minute per IP against `/api/auth/**`, which a few failed attempts can reach.

## Running it

```sh
yarn workspace auth start      # webpack --watch
yarn workspace auth serve      # serve dist -p 3006
yarn workspace auth typecheck
```

`src/standalone.tsx` is a shell-free harness (`webpack`'s `entry`) with buttons that push
`/login` and `/register` and a readout of every bus event this MFE publishes — if `AUTH_LOGIN`
does not appear there, no sibling would have reacted either. The federated entry is `src/Auth.tsx`.

Both entries need a backend at `http://localhost:8080` (`config.ts` in `api-client` hardcodes it).
