# examination

Recording an examination: the anamnesis, the diagnosis, the therapy and its prescribed medicines.

| | |
|---|---|
| Port | 3004 |
| MF name | `examination` |
| Exposes | `./Examination` |
| Stack | **Angular 22**, standalone components, signals, zoneless. AOT-compiled. |
| Route | `/examination` — the wide (3/4) column of a horizontal split |

## Why Angular

Three reasons, in order of weight.

**It is the only consumer of `design-system-angular`.** That package — a `@Directive` per `mm-*` tag,
`MmInputDirective` implementing `ControlValueAccessor`, `strictTemplates` type-checking every
binding — existed with nothing importing it. A binding library with no consumer is a library whose
claims have never been tested. Every directive in it is exercised here except `MmToastDirective` and
`MmToastRegionDirective`, which belong to `notifications`.

**Multiple frameworks in one application is the thesis.** `/examination` composes this Angular
application beside `icd10`, which is Vue 3; `calendar` is React 19, `nav` and `notifications` are
plain custom elements, and the design system is Lit. That the composition boundary is the *browser* —
custom elements, DOM events, `localStorage` — and not a shared build is the claim this repo is making,
and it is only falsifiable if the frameworks really are different. Angular and Vue on one screen is
the sharpest case: neither can import the other's components even in principle.

**Reactive forms fit this screen.** This is the most form-heavy feature in the application: three
validated text fields, a nested dialog with its own form group, cross-field date validation, and two
required values that arrive from *outside* the form. `@angular/forms` is built for exactly that, and
using it as intended is more honest than porting `calendar`'s zod-and-react-hook-form idiom into a
framework that already owns validation state.

## The split

The doctor works in this form across three quarters of the screen. The remaining quarter is `icd10`,
a separate remote on a separate port, where they search the ICD-10 catalogue and select a diagnosis.

The two are coupled by exactly one thing: the `ICD10_DISEASE_SELECTED` event on the shared bus.
Neither package imports the other — neither can name a symbol from the other — so either can be
redeployed while the other keeps running. `ExaminationDraftStore`'s constructor is where that
coupling is cashed in, in one subscription; `DiagnosisPanelComponent` is where it becomes visible.
The panel is styled as a *field* even though it contains no input, because the diagnosis is a
required value of this form that happens to be collected somewhere else, and the doctor has no reason
to care where.

The 3:1 geometry is **not in this package**. It is `.mm-split--primary` in the design system, applied
by the shell around the two mount points. A fragment renders into its own mount point and cannot see
the screen it shares, so a remote that claimed a share of the width would be imposing a layout on a
sibling it cannot observe.

`CALENDAR_APPOINTMENT_SELECTED` is the second inbound event, and `EXAMINATION_COMPLETED` the one
outbound one.

## Zoneless, and why that is not a detail

There is no `zone.js` in this package's dependencies and none in the federation shared scope.
`zone.js` monkey-patches `setTimeout`, `Promise`, `addEventListener` and more, **globally**. In a
single-page application that is an implementation detail; in a shared document it means an Angular
remote silently changing the runtime underneath React 19, Vue 3, Lit and two plain-custom-element
MFEs that never asked for it — including the Vue remote sharing this very screen.

`provideZonelessChangeDetection()` makes it unnecessary, at the cost of a discipline every component
here follows: state is signals, change detection is `OnPush`, and nothing relies on an async
operation being noticed automatically.

## Lifecycles are hand-written

`src/Examination.ts` exports `bootstrap`/`mount`/`unmount` with no `single-spa-angular` and no
`import 'single-spa'`. single-spa's contract is three functions returning promises, which Angular's
own bootstrap already provides. Skipping the adapter also keeps this remote clear of the repo's
version split — the shell is on single-spa 5 while the modern MFEs are on 6, and a package that
imports neither cannot be caught between them.

It uses `createApplication` + `createComponent`, **not** `bootstrapApplication`, and the difference
matters: `bootstrapApplication` finds its host by running the root component's selector against the
*document*. `createComponent` takes the host element explicitly, so this application can only ever
render into the div the shell handed it.

`unmount` calls `destroy()`, and every teardown in the package rides on it — `DestroyRef.onDestroy`
unsubscribes the auth-store bridge, the three event-bus listeners and the medicine search's pending
debounce timer. That is why they were registered through `DestroyRef` rather than by hand: single-spa
unmounts this application on every route change away from `/examination`, so "leaks once per
navigation" is the default failure mode here, not an edge case.

## AOT, not `ts-loader`

`webpack.config.js` uses `@ngtools/webpack` (`AngularWebpackPlugin` + `AngularWebpackLoaderPath`)
while `calendar` and `auth` use `ts-loader`. `ts-loader` would compile the TypeScript and never look
at a template, so `[oepn]="true"` on an `<mm-modal>` would build clean and do nothing at runtime —
forfeiting the entire argument for `design-system-angular`. It would also leave templates to be
compiled in the browser, which means shipping `@angular/compiler` to every visitor.

The consequence for the toolchain: `yarn workspace examination typecheck` runs **`ngc`**, not
`tsc --noEmit`. `tsc` alone checks neither templates nor host bindings.

## Phases, not flags

`ExaminationDraftStore.phase()` derives one of `selecting-appointment` | `editing` | `submitting` |
`recorded`, and `ExaminationApp` is an `@switch` over it. Recording an examination is genuinely
sequential — you cannot write an anamnesis for nobody, and you cannot edit one that has been
committed — so a phase makes the impossible states unrepresentable rather than merely unlikely.

`editing` and `submitting` deliberately render the same pane with its controls locked. A submit in
flight is the same screen, not a different one; swapping the form for a spinner would discard the DOM
the doctor is looking at and make a failed submit reappear as a jarring remount.

## What lives in the store and what lives in the form

The store holds what the form cannot: the appointment and the diagnosis, both of which arrive from
other micro-frontends. The anamnesis, start time and therapy instructions stay in the `FormGroup`,
which already owns their `touched`/`dirty`/`errors` state and the `ControlValueAccessor` that
`MmInputDirective` implements. Duplicating them into signals would mean two systems holding one
truth.

The two halves meet at the submit, and are kept separate on purpose: a blocked submit can then say
*which* piece is missing — most usefully, "the diagnosis is in the pane beside this form", which
nothing on the form itself could otherwise explain.

## Validation is a courtesy, never the enforcement point

Every validator in `src/forms/validators.ts` mirrors a backend constraint: `@NotBlank` on
`medicalHistory`/`diagnosisCode`/`therapyDescription`, `@PastOrPresent` on `startTime`,
`@PositiveOrZero` on the dosing interval. The backend re-checks all of it under `@Valid`, re-checks
the role in `@PreAuthorize`, and re-checks row-level ownership in `AccessGuard` — which also writes a
`medical_access_log` row. What client validation buys is that the doctor learns about a blank field
before losing a round trip.

`AuthStore.isDoctor` is the same kind of claim: it decides what the UI *offers*, exactly like `roles`
in nav's `nav-links.ts`. It is not authorisation.

One validator is worth singling out. `notInFuture` allows five minutes of forward clock skew and
`toSubmittableStartTime` clamps the submitted value to now, so a client running slightly ahead of the
server cannot have a correctly filled form rejected by `@PastOrPresent`.

## No TanStack Query

`calendar` uses it because it has a genuine cache problem: several components read one appointment
list, mutations must invalidate it, and the detail pane derives its DTO from the cache by id so it
cannot show a stale snapshot. None of that applies here — this MFE issues short-lived reads shown
once and one command.

`src/state/async-state.ts` is the forty lines that keep the three disciplines TanStack Query would
have enforced for free: never render "empty" while a request is in flight, keep the last good data
visible during a refresh instead of flashing a spinner, and drop a superseded response. That last one
is not the debounce — two requests that both survive a 300 ms debounce can still land out of order,
which is the classic autocomplete bug.

## Prescriptions

`ExaminationRequest.medicineUsages` had no UI at all before this: the previous implementation
hardcoded `medicineUsages: []`, so `MedicineUsageRequest` and the whole `Therapy → MedicineUsage →
Medicine` branch were unreachable from the application. `PrescriptionListComponent` and
`PrescriptionDialogComponent` close that.

They are optional, and the empty state says so — the field has no `@NotEmpty`, and an examination that
concludes no medication is needed is a legitimate clinical outcome, not an incomplete form.

Two details worth knowing before editing them. The same medicine at two *different* intervals is
allowed (a loading dose then a maintenance dose) while the same medicine at the same interval is
rejected as a duplicate. And the request field is `usageFrequencyInHours` while the response DTO
calls the same value `frequencyIntakeInHours` — `toMedicineUsageRequest` in `src/models/prescription.ts`
is the only place that has to know.

## Styles

`src/styles.css` holds only `exam-*`-namespaced rules, every value a `var(--mm-token, fallback)`. The
document-wide theme (`tokens.css` / `global.css`) is loaded once by the shell — two remotes each
shipping a reset is the classic micro-frontend CSS collision, and whichever loads second silently
wins.

Nothing in that file can reach an `mm-*` component's internals: they render into shadow roots, so a
selector like `.exam-form mm-input .field` is unreachable *by construction*. What crosses the
boundary is a `--mm-*` custom property or an exported `part`. The rules here lay out the spaces
*between* components.

## Running it standalone

```sh
yarn workspace examination start     # webpack --watch
yarn workspace examination serve     # serve dist -p 3004
```

`http://localhost:3004` is the dev harness, and it plays the part of the other half of the split:
the narrow pane is a stand-in that publishes `ICD10_DISEASE_SELECTED` on the same bus with real
ICD-10 codes (real ones, because the backend rejects a `diagnosisCode` that is not in the seeded
`disease` table). If the diagnosis pane fills in when a harness button is pressed, it will fill in
when the real remote is beside it — the contract is the event and nothing else.

The harness reproduces the 3:1 ratio in its own CSS rather than importing `.mm-split--primary`, so
the form is developed at the width it ships at without this page becoming a second definition of the
layout. It also logs `EXAMINATION_COMPLETED` and `NOTIFICATION_SHOW`, which is the point: there is no
`notifications` remote here, and a message that is emitted but never logged is one the real toast
layer would also have missed.

A running backend at `http://localhost:8080` is required for anything beyond the empty states, and a
`ROLE_DOCTOR` token in `localStorage` (sign in through the `auth` MFE on :3006, or run the full
`yarn start`).

## File map

| Path | What it is |
|---|---|
| `src/Examination.ts` | Federated entry: hand-written single-spa lifecycles, shared providers, the `ErrorHandler` blast radius |
| `src/ExaminationApp.ts` | Root component — the `@switch` over `phase()` |
| `src/state/examination-draft.store.ts` | The draft, and the bus subscriptions that fill it |
| `src/state/auth.store.ts` | Angular bridge over the shared auth store |
| `src/state/event-bus.service.ts` | `DestroyRef`-scoped bus subscriptions |
| `src/state/async-state.ts` | Loading/error/data holder with the out-of-order guard |
| `src/components/` | Eight components: picker, context, form, diagnosis panel, prescription list + dialog, medicine search, summary |
| `src/forms/validators.ts` | Validators mirroring the backend constraints, plus `firstErrorMessage` |
| `src/services/` | `createService` wrappers for examinations, medicines, appointments, reports |
| `src/utils/date-time.ts` | The offset-free `LocalDateTime` ↔ `datetime-local` conversions |
| `src/utils/error-message.ts` | `ApiError` → doctor-readable text |
| `src/models/prescription.ts` | The draft prescription view model and its narrowing to the wire format |
