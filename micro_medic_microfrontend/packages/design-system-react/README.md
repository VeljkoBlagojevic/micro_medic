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

React (through v19) does not treat custom elements as first-class:

1. **Props become attributes.** React stringifies unknown JSX props onto the element, so
   `rows={[{…}]}` arrives as `"[object Object]"` and `open={false}` becomes the *string*
   `"false"` — which is truthy as an attribute, so the modal would never close.
2. **Custom events are unreachable.** There is no `onMm-close` prop, so `mm-close` can only be
   observed with an imperative `addEventListener`.

`@lit/react`'s `createComponent` fixes both: it assigns declared reactive fields as
**properties** and maps DOM event names to React-style callback props.

This replaces three hand-rolled `useRef` + `useEffect` adapters that previously lived in the
`calendar` package. Those had to re-implement property assignment per prop, and drifted — one
bound a `dissmissible` typo, another declared a `heading` prop while its callers passed
`title`.

## Event props

| Component | Prop | DOM event |
|---|---|---|
| `MmInput` | `onInput`, `onChange`, `onBlur` | `mm-input`, `mm-change`, `mm-blur` |
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
