# @micro-medic/design-system

Framework-agnostic Lit web components. This is the **single implementation** of every visual
component in the app; each framework gets a thin binding layer on top rather than its own
reimplementation.

```
design-system              (Lit)  ← the components live here, once
├── design-system-react    (@lit/react wrappers)
├── design-system-angular  (a @Directive per tag)
├── parcel.ts              (single-spa parcel, for the plain-JS / Svelte MFEs)
└── lifecycles.ts          (single-spa application, for custom-element MFEs)
```

## Using it

**React** — use the bindings, not the tags:

```tsx
import { MmButton, MmModal } from '@micro-medic/design-system-react';
```

**Anything else** — import the package for its registration side effect and use the tags:

```js
import '@micro-medic/design-system';
import '@micro-medic/design-system/src/tokens.css';   // once per page, in the shell
```

```html
<mm-button variant="primary">Save</mm-button>
```

`tokens.css` sets the `--mm-*` custom properties on `:root`. Custom properties pierce shadow
DOM, so it is the whole theming API. Components carry hardcoded fallbacks, so a missing
`tokens.css` degrades rather than breaks.

## Components

| Tag | Notable properties | Events |
|---|---|---|
| `mm-button` | `variant`, `size`, `loading`, `disabled`, `full-width`, `type` | — (native `click`) |
| `mm-card` | `heading`, `clickable` | `mm-card-click` |
| `mm-input` | `label`, `value`, `type`, `error`, `hint`, `multiline`, `required` | `mm-input`, `mm-change`, `mm-blur` |
| `mm-select` | `label`, `value`, `options`, `placeholder`, `error`, `hint`, `required` | `mm-input`, `mm-change`, `mm-blur` |
| `mm-modal` | `open`, `heading`, `size`, `dismissible` | `mm-close` |
| `mm-table` | `columns`, `rows`, `clickable`, `row-key` | `mm-row-click` |
| `mm-spinner` | `size`, `label`, `centered`, `hide-label` | — |
| `mm-empty-state` | `heading`, `description`, `icon` | — |
| `mm-error-state` | `heading`, `description`/`message`, `retryable` | `mm-retry` |
| `mm-toast` | `message`, `type`, `toast-id`, `dismissible` | `mm-toast-dismiss` |
| `mm-toast-region` | `placement`, `max-visible`; `show()`/`dismiss()`/`clear()` | `mm-toast-dismiss` |

`mm-toast-region` is the one component with an **imperative** API, because a notification is an
event rather than state: a caller holding a `toasts` array would have to prune expired entries
itself and would fight the element over ownership of the list. It knows nothing about the event
bus — subscribing to `NOTIFICATION_SHOW` and deciding how long each type lives belongs to the
`notifications` MFE, which is what keeps this package free of any dependency on `shared-store`.

## Two ways a custom element joins the composition

Both are exported here, because both are about custom elements in single-spa rather than about any
one micro-frontend:

- **`mountDesignSystemParcel`** (`parcel.ts`) — a single-spa *parcel*: one `mm-*` element rendered
  inside an app that is already mounted. The escape hatch for the plain-JS and Svelte MFEs.
- **`createCustomElementLifecycles(tag)`** (`lifecycles.ts`) — a single-spa *application* whose
  entire UI is one custom element. `nav` uses it for `<nav-app-bar>`/`<nav-footer>`,
  `notifications` for `<notification-center>`. A custom element's
  `connectedCallback`/`disconnectedCallback` already *are* single-spa's contract, so the adapter
  only appends and removes a node; it imports nothing from `single-spa`, so the same function
  works for the v5 and v6 halves of this repo.

`defineElement` is exported for the same reason — an MFE that defines its own elements (`nav`,
`notifications`) should use the same guarded registration rather than duplicate it.

## Conventions

- **Register through `defineElement(tag, ctor)`**, never `customElements.define` directly. The
  registry is per-*document*, so a duplicate `define` throws and would take down whichever MFE
  loaded second. This is also why any package rendering `mm-*` tags must declare `lit` and
  `@micro-medic/design-system` as federation **singletons**: a second copy would find every tag
  already defined and its component classes would never be used.
- **Events are `mm-`-prefixed, `bubbles: true` *and* `composed: true`.** Without `composed` an
  event stops at the shadow boundary and no consumer outside the component ever sees it.
- **`slot` for content, properties for data.** `columns`/`rows` are `attribute: false` because
  objects cannot round-trip through an attribute.
- **Every colour, space, and radius is a `var(--mm-*, fallback)`.** Add the token to
  `tokens.css` before referencing it.
- Styles compose `baseStyles` (and `focusRing` for anything interactive) from
  `styles/shared.styles.ts`.

## Adding a component

1. `src/components/mm-thing.ts` — extend `LitElement`, `static styles = [baseStyles, css`…`]`,
   end with `defineElement('mm-thing', MmThing)` and an `HTMLElementTagNameMap` entry.
2. Export it from `src/components/index.ts`.
3. Add a binding in `design-system-react/src/components.ts`, mapping any custom events to
   React-style prop names, and a directive in `design-system-angular/src/lib/`.
4. Add the row to the table above.
