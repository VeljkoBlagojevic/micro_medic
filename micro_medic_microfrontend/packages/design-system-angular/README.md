# @micro-medic/design-system-angular

Angular bindings for the Lit components in `@micro-medic/design-system`. No component is
reimplemented here — each export is a **directive whose selector is the custom element's tag**,
giving that tag a type-checked Angular API.

```ts
import { Component } from '@angular/core';
import { MM_DESIGN_SYSTEM } from '@micro-medic/design-system-angular';

@Component({
    standalone: true,
    imports: [MM_DESIGN_SYSTEM],
    template: `
        <mm-modal [open]="open" heading="Book appointment" (close)="open = false">
            <mm-input label="Reason" [(ngModel)]="reason" />
            <div slot="footer">
                <mm-button variant="primary" [loading]="saving" (click)="save()" label="Save" />
            </div>
        </mm-modal>
    `,
})
export class BookAppointment { /* … */ }
```

Importing this package registers the custom elements as a side effect, so there is no separate
`import '@micro-medic/design-system'` to remember.

## Why a wrapper is needed

Angular *can* render a custom element with no wrapper at all — but only after the consuming
component opts into `CUSTOM_ELEMENTS_SCHEMA`, which disables template type-checking for **every**
unknown tag in that component. That is a bad trade for a design system:

- `<mm-button varaint="primary">` and `<mm-modal [oepn]="true">` compile silently, so a typo in a
  design-system prop is a runtime bug instead of a build error.
- Bindings become attributes, and an attribute can only carry a string. `[rows]="patients"` on
  `mm-table` would stringify an array to `"[object Object]"`, and `[open]="false"` would become
  the *string* `"false"` — truthy as an attribute, so the modal would never close.
- There is no typed way to hear `mm-close`; you are left with `addEventListener`.

A directive selected on the tag fixes all three. Angular resolves `[variant]` against the
directive's `@Input`, so `strictTemplates` stays on, every binding is checked, and each input is
forwarded to the element as a **property** (see `MmElementDirective`).

## Inputs

Every element property is an `@Input` of the same name. Boolean inputs are coerced with
`booleanInput`, so the bare attribute form works as it does on native elements —
`<mm-button disabled>` means `true`, not the falsy empty string.

An input left unset is **not** forwarded: writing `undefined` would clobber the element's own
default (e.g. `mm-spinner`'s `label`, `mm-modal`'s `dismissible`). Only inputs you actually bind
are applied.

`nativeElement` is exposed on every directive for the elements' imperative APIs
(`mm-input`'s `focus()` and `checkValidity()`).

## Outputs

| Element | Output | DOM event |
|---|---|---|
| `mm-input` | `valueInput`, `valueChange`, `touched` | `mm-input`, `mm-change`, `mm-blur` |
| `mm-modal` | `close` | `mm-close` |
| `mm-card` | `cardClick` | `mm-card-click` |
| `mm-table` | `rowClick` | `mm-row-click` |
| `mm-error-state` | `retry` | `mm-retry` |

Handlers receive the raw `CustomEvent`, so read the payload off `detail`:

```html
<mm-table [columns]="columns" [rows]="patients" clickable
          (rowClick)="open($event.detail.row)" />
```

`mm-button` has no `click` output — `click` is a native bubbling event, so Angular's own
`(click)` works on the tag unchanged.

`mm-modal` closes itself on Escape and backdrop click, so `[open]` is one-way in and `(close)` is
the signal to update your own state. Nothing writes back to the binding.

## Forms

`MmInputDirective` implements `ControlValueAccessor`, so `<mm-input>` works with `[(ngModel)]`,
`formControlName` and `formControl` directly:

```html
<mm-input label="Anamnesis" multiline [rows]="5" formControlName="anamnesis"
          [error]="form.controls.anamnesis.touched ? 'Required' : ''" />
```

This is the one place where the wrapper does more than forward properties. `<mm-input>` is not a
form-associated custom element, so Angular's built-in `DefaultValueAccessor` cannot drive it —
that accessor listens for the native `input` event and writes `.value` on a real `<input>`, but
here the real control lives inside a shadow root. The accessor is implemented against the
component's composed `mm-input` / `mm-blur` events instead, which is the Angular counterpart of
what `MmField` does for react-hook-form on the React side.

Do **not** combine `[value]` with a form directive on the same element — the form control and the
template binding would both claim ownership of the value. Pick one.

## Theming

This package imports no CSS. The theme (`tokens.css` + `global.css`) is a document-wide
stylesheet, and a document-wide stylesheet shipped by a micro-frontend collides with every other
MFE that ships one — whichever loads second silently wins. **The shell loads it once.**

To restyle a component from an Angular MFE, set a `--mm-*` custom property; custom properties are
the only CSS that pierces a shadow boundary. A plain `::ng-deep .mm-btn` cannot reach component
internals no matter how it is written.

## Adding a binding

Extend `MmElementDirective<TElement>` and declare only the inputs — forwarding is generic:

```ts
@Directive({ selector: 'mm-thing', standalone: true, host: { '(mm-something)': 'forward(something, $event)' } })
export class MmThingDirective extends MmElementDirective<MmThing> {
    @Input() flavour?: ThingFlavour;
    @Output() readonly something = new EventEmitter<CustomEvent<void>>();
}
```

Then add it to the barrel and to `MM_DESIGN_SYSTEM` in `src/index.ts`.

Use `forward(output, $event)` rather than `output.emit($event)` in a host listener: Angular types
`$event` as plain `Event` for any event name outside the known DOM map, so the direct form fails
`strictTemplates`. `forward` keeps that cast in one place while leaving the public output type
accurate.

## Module Federation

Share this package as a `singleton` in every Angular remote's webpack config, alongside
`@micro-medic/design-system`, `@angular/core` and `@angular/common`. Two copies of the design
system would mean two attempts to register the same tags — `defineElement` guards against the
resulting `NotSupportedError`, but the second copy's components then go unused while its
directives keep setting properties on elements built from the first.

## Verifying

```sh
yarn workspace @micro-medic/design-system-angular typecheck   # tsc --noEmit
```

`tsc` alone does **not** check host bindings or template expressions. Run the Angular compiler
for that:

```sh
npx ngc -p tsconfig.json --outDir ./dist-ngc-check
```
