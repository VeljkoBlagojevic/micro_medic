# @micro-medic/design-system-react

React bindings for the Lit components in `@micro-medic/design-system`. No component is
reimplemented here — each export is a generated wrapper around the corresponding custom
element.

```tsx
import { MmButton, MmModal, MmTable } from '@micro-medic/design-system-react';

<MmModal open={open} heading="Book appointment" onClose={close}>
    <p>…</p>
    <div slot="footer">
        <MmButton variant="primary" loading={saving} onClick={save}>Save</MmButton>
    </div>
</MmModal>
```

Importing this package registers the custom elements as a side effect, so there is no separate
`import '@micro-medic/design-system'` to remember.

## Why a wrapper is needed

Two reasons, and only one of them still bites on React 19:

1. **Custom events are unreachable — and this is the reason that survives.** JSX has no
   `onMm-close` prop and React 19 added none, so `mm-close` can otherwise only be observed with an
   imperative `useRef` + `addEventListener` per element, per event.
2. **Props became attributes.** Before 19, React stringified an unknown JSX prop onto the element:
   `rows={[{…}]}` arrived as `"[object Object]"` and `open={false}` as the *string* `"false"`,
   truthy as an attribute, so the modal never closed. **React 19 fixed this** — it now assigns to a
   matching property on the element instance when one exists and only falls back to an attribute
   otherwise, and Lit declares its reactive properties on the instance. Both consumers here
   (`calendar`, `auth`) are on 19, so this half is historical. Do not delete the note: it is why the
   three hand-rolled adapters existed, and a package pinned to React 18 would hit it again.

`@lit/react`'s `createComponent` covers both: it assigns declared reactive fields as **properties**
and maps DOM event names to React-style callback props. Point 1 alone justifies it — a binding layer
that existed only for point 2 would now be deletable.

This replaces three hand-rolled `useRef` + `useEffect` adapters that previously lived in the
`calendar` package. Those had to re-implement property assignment per prop, and drifted — one
bound a `dissmissible` typo, another declared a `heading` prop while its callers passed
`title`.

## Event props

| Component | Prop | DOM event |
|---|---|---|
| `MmInput` | `onInput`, `onChange`, `onBlur` | `mm-input`, `mm-change`, `mm-blur` |
| `MmSelect` | `onInput`, `onChange`, `onBlur` | `mm-input`, `mm-change`, `mm-blur` |
| `MmModal` | `onClose` | `mm-close` |
| `MmCard` | `onCardClick` | `mm-card-click` |
| `MmTable` | `onRowClick` | `mm-row-click` |
| `MmErrorState` | `onRetry` | `mm-retry` |

Handlers receive the raw `CustomEvent`. Read the payload off `detail`, or use the `valueOf`
helper for inputs:

```tsx
import { valueOf, type MmRowClickEvent } from '@micro-medic/design-system-react';

<MmInput onInput={(e) => setName(valueOf(e))} />
<MmTable onRowClick={(e: MmRowClickEvent<PatientDto>) => open(e.detail.row)} />
```

## `MmField`

A controlled input built on `MmInput`, taking `value` / `onValueChange`. It is deliberately
**not** bound to a form library — the react-hook-form adapter lives in the consuming MFE
(`calendar/src/components/MmFormField.tsx`), so the design system stays dependency-free.

## `MmSelectField`

The same contract for `MmSelect`: `value` / `onValueChange` plus an `options` array. Values are
always strings, because a DOM select value is a string — a caller that needs a number converts
at its own edge (see `auth/src/components/MmSelectFormField.tsx`, whose `numeric` flag also maps
"nothing selected" to `undefined` rather than `NaN`).

## Adding a binding

Add one line to `src/components.ts`. The element class supplies the prop types, so nothing
needs to be typed by hand:

```ts
export const MmThing = createComponent('mm-thing', MmThingElement, {
    onSomething: 'mm-something',
} as const);
```

## Module Federation

Share this package as a `singleton` in every remote's webpack config, alongside
`@micro-medic/design-system`. Two copies would mean two sets of wrappers racing to register the
same tags.
