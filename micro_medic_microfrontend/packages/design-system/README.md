# @micro-medic/design-system

Framework-agnostic Lit web components. This is the **single implementation** of every visual
component in the app — never reimplemented per framework. What each consumer adds on top is however
much glue its framework actually needs, which across the four frameworks here ranges from a whole
package down to nothing at all (see "How much glue each framework needs" below).

```
design-system              (Lit)  ← the components live here, once
├── design-system-react    (@lit/react wrappers)
├── design-system-angular  (a @Directive per tag)
└── lifecycles.ts          (single-spa application, for custom-element MFEs)
```

## Using it

**React** — use the bindings, not the tags:

```tsx
import { MmButton, MmModal } from '@micro-medic/design-system-react';
```

**Angular** — same, from `@micro-medic/design-system-angular`; `MM_DESIGN_SYSTEM` imports every
directive at once.

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

## How much glue each framework needs

The two binding packages are not a per-framework tax; they are **compensation for two specific
framework defects**, and the repo has the consumers to show it:

| Consumer | Glue | The defect being compensated for |
|---|---|---|
| `nav`, `notifications` (custom elements) | none | — a custom element consuming another needs no adapter |
| `icd10` (Vue 3) | one build predicate + a `.d.ts` | none, really. Vue sets non-primitive bindings as properties and `@mm-input` via `addEventListener`. It needs `isCustomElement` so the compiler emits the tag, and a `GlobalComponents` interface so `vue-tsc` checks the bindings |
| `calendar`, `auth` (React 19) | `design-system-react` | JSX has no prop for a custom event, so `mm-close` needs a `useRef` + `addEventListener` per element. (React ≤18 also stringified unknown props onto attributes — `open={false}` → a truthy `"false"` — but 19 assigns to a matching instance property first, so that half is historical) |
| `examination` (Angular 22) | `design-system-angular` | accepting an unknown tag needs `CUSTOM_ELEMENTS_SCHEMA`, which switches template type-checking off for *every* unknown tag in the component |

Vue is the control case, which is why there is deliberately **no `design-system-vue`**. Its typings
live in `icd10` rather than here: a `GlobalComponents` interface in this package would make all five
consumers depend on Vue's types to use a Lit element, and `lit` being the only dependency is what lets
four frameworks share this package at all.

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

## How a custom element joins the composition

Exported here rather than from one MFE, because it is about custom elements in single-spa rather than
about any one micro-frontend:

- **`createCustomElementLifecycles(tag, projectAttributes?)`** (`lifecycles.ts`) — a single-spa
  *application* whose entire UI is one custom element. `nav` uses it for
  `<nav-app-bar>`/`<nav-footer>`, `notifications` for `<notification-center>`. A custom element's
  `connectedCallback`/`disconnectedCallback` already *are* single-spa's contract, so the adapter
  only appends and removes a node; it imports nothing from `single-spa`, so the same function works
  regardless of which single-spa major a consumer happens to be on.

  The optional second argument is the one thing single-spa's contract has no equivalent for: it turns
  the host's `customProps` into **attributes** on the element, and keeps them current while mounted
  (Geers §6.1.1). Attributes are set *before* insertion, since `attributeChangedCallback` fires on a
  disconnected element — so the fragment's first render already has its context instead of flickering
  through a default. `nav` passes one; `notifications` needs none.

  What the projector is, and is not: it returns an `AttributeSource`, and the *projection* belongs to
  the consumer. This package depends on `lit` and nothing else, so it cannot know what a session is —
  `nav/src/session-attributes.ts` decides that a session flattens to three scalars, and the adapter
  only writes what it is handed. Returning `null` is a supported answer, meaning "this host passed
  nothing", which is what a dev harness does.

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
   React-style prop names, and a directive in `design-system-angular/src/lib/`. Nothing to do for
   Vue or the custom-element MFEs — but if `icd10` renders the new tag, add it to that package's
   `src/types/design-system.d.ts` so `vue-tsc` can check the bindings.
4. Add the row to the table above.
