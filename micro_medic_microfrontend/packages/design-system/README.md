# @micro-medic/design-system

Framework-agnostic Lit web components. This is the **single implementation** of every visual
component in the app; each framework gets a thin binding layer on top rather than its own
reimplementation.

```
design-system            (Lit)  ← the components live here, once
├── design-system-react  (@lit/react wrappers)
└── parcel.ts            (single-spa parcel, for the plain-JS / Svelte MFEs)
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
| `mm-modal` | `open`, `heading`, `size`, `dismissible` | `mm-close` |
| `mm-table` | `columns`, `rows`, `clickable`, `row-key` | `mm-row-click` |
| `mm-spinner` | `size`, `label`, `centered`, `hide-label` | — |
| `mm-empty-state` | `heading`, `description`, `icon` | — |
| `mm-error-state` | `heading`, `description`/`message`, `retryable` | `mm-retry` |

## Conventions

- **Register through `defineElement(tag, ctor)`**, never `customElements.define` directly. A
  duplicate `define` throws and would take down whichever MFE loaded second — possible
  whenever a remote fails to negotiate the shared scope.
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
   React-style prop names.
4. Add the row to the table above.
