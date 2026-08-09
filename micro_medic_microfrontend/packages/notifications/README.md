# notifications

The application-wide toast layer. Subscribes to `NOTIFICATION_SHOW` on the event bus and renders each
payload into the design system's `<mm-toast-region>`.

| | |
|---|---|
| Port | 3007 |
| MF name | `notifications` |
| Exposes | `./Notifications` |
| Stack | **Native custom elements**, TypeScript. No framework. |

## Why it is its own micro-frontend

It was a third application inside `nav`, and the shell's route table is what gave it away: the chrome
is suppressed on `/login` and `/register` (`exceptRoutes` in `home/src/routes.js`), while a failed
sign-in is the case that most needs a toast. So the toast layer needed a different activity function
from the header's — and a fragment with its own route contract, its own set of consumers (every MFE
that emits, versus the one team that owns the chrome) and its own reason to change is a different
micro-frontend. Bundled into the header it would also have inherited the header's deploy cadence for
nothing.

It is the only entry in the shell's table with `routes: ['*']` and **no** `exceptRoutes`.

## The split with the design system

This is the useful half of the story, and the reason the package is so small.

- **`mm-toast` / `mm-toast-region`** (in `@micro-medic/design-system`) own everything about how a
  toast *looks and behaves*: the four surface treatments, `role="alert"` for failures versus
  `role="status"` for the rest, stacking, the cap, the auto-dismiss timers, and the `--mm-z-index-toast`
  stacking level. All of it is reusable by any consumer in any framework, which is what makes it
  design-system furniture. `--mm-z-index-toast` had been sitting in `tokens.css` with no consumer,
  waiting for exactly this.
- **This package** owns what is specific to *this application*: which bus events become toasts, how
  long each type lives (`src/durations.ts`), and what a logout does to messages already on screen.
  That is application wiring, not presentation.

Two elements rather than one, so a consumer can render a single inline toast without the region's
machinery. And the region's API is imperative (`show`/`dismiss`/`clear`) rather than a `toasts`
array property, because a notification is an event, not state: a caller holding the array would have
to prune expired entries itself and would fight the element over ownership of the list.

The design system stays free of any dependency on `shared-store` as a result — it never learns that
an event bus exists.

## Duration policy

`src/durations.ts`, and it is the one product decision this package makes:

| type | duration |
|---|---|
| `error` | until dismissed |
| `warning` | 8 s |
| `info` | 5 s |
| `success` | 4 s |

Failures are sticky on purpose. A toast that says the save did not happen and then disappears after
four seconds is worse than no toast, because the user is left believing it did. An emitter may
override with `duration` (and `0` is honoured as sticky, not treated as absent), because it
occasionally knows something the table cannot.

## Fire-and-forget, deliberately

A notification published while this application is unmounted is **lost**, and that is correct rather
than a gap. The bus is a live channel, not a queue: replaying a five-minute-old "Saved" toast on the
next mount would be worse than dropping it. None of the emitters — `calendar`'s mutation hooks,
`auth`'s sign-in flow, `examination` — waits for an acknowledgement.

Two things do travel back out:

- **`NOTIFICATION_DISMISSED`** is emitted for every removal, whether clicked, expired or
  programmatic. Nothing subscribes to it today, and it is still worth emitting: it is the half of the
  contract that lets an emitter correlate a toast it owns by id. The alternative — reaching for this
  element across the MFE boundary — is the coupling the bus exists to prevent.
- **`AUTH_LOGOUT`** clears the stack, via `clear()` so no dismissal events fire. The messages on
  screen are about the session that just ended, and one of them may name a patient; leaving them over
  the login screen would keep one user's data visible to the next.

## Details worth not undoing

- **No framework, for the same reason as `nav`**: mounted on every route, so any runtime it pulled in
  would be paid for on first paint by every visitor — and there is no state here worth a framework,
  just one subscription and one method call.
- **No stylesheet at all.** Everything visible is inside `mm-toast-region`'s shadow root, so a
  document-level rule could not reach it. A micro-frontend with genuinely nothing to style is the
  strongest evidence the split landed in the right place.
- **The region is created once in the constructor**, not per mount, so `show()` always has a known
  element rather than a `querySelector` that may return `null`. Timers live in the region and it
  clears them in its own `disconnectedCallback`.
- **Subscriptions are re-entrant.** `connectedCallback` tears down before subscribing, because an
  element moved in the DOM disconnects and reconnects — a second subscription would show every toast
  twice, the classic symptom of this bug.
- **Nothing is `position`ed by the host.** The region is `position: fixed`, which is why the shell can
  mount this micro-frontend at the end of the body and outside `.mm-container`.

## Running it

```sh
yarn workspace notifications start      # webpack --watch
yarn workspace notifications serve      # serve dist -p 3007
yarn workspace notifications typecheck
```

`src/standalone.ts` + `public/index.html` are a shell-free harness, and since this MFE has no UI of
its own to develop it is really a test bench for the contract: buttons that emit each type, one that
re-emits the same `id` (replacement rather than stacking), one that fires five at once against a cap
of four, and a real `authStore.logout()`. Watch the console for `NOTIFICATION_DISMISSED`. No backend
is needed.
