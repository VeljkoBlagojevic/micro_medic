# icd10

The ICD-10 diagnosis catalogue: search ~71,700 codes, select one, publish it to the examination form.

| | |
|---|---|
| Port | 3002 |
| MF name | `icd10` |
| Exposes | `./ICD10` |
| Stack | **Vue 3**, `<script setup>` Composition API, SFCs, TypeScript |
| Route | `/examination` — the narrow (1/4) column of a horizontal split |

## Why Vue, and why there is no `design-system-vue`

This package is the answer to a question the repo raises but could not previously settle: **does every
framework need a design-system binding package?**

No. Two of the four need one, for two specific and different defects:

- **React** has no prop for a custom event: observing `mm-close` means a `useRef` +
  `addEventListener` per element, per event. `design-system-react` is `@lit/react`'s
  `createComponent`, one line per component. (React ≤18 also stringified an unknown JSX prop onto an
  attribute — `rows={[…]}` → `"[object Object]"`, `open={false}` → a truthy `"false"` — but 19
  assigns to a matching instance property first, so only the event half still bites.)
- **Angular** would need `CUSTOM_ELEMENTS_SCHEMA` to accept an unknown tag, and that switches template
  type-checking off for *every* unknown tag in the component, not just the intended one.
  `design-system-angular` is eleven directives selecting on the tags, so `strictTemplates` keeps working.

Vue 3 has neither defect. It sets a non-primitive binding on an unknown element as a DOM **property**
and registers `@mm-input` with `addEventListener`, so `<mm-input :value="q" @mm-input="onInput" />`
works with no adapter at all. What this package needs instead is:

1. one line of build config — `compilerOptions.isCustomElement: tag => tag.startsWith('mm-')` in
   `webpack.config.js`, which makes the compiler emit `<mm-button>` as an element rather than warning
   about an unresolved component;
2. a declarative `GlobalComponents` interface in `src/types/design-system.d.ts`, so `vue-tsc` checks
   the bindings and a misspelled `heading` is a build error rather than a silent no-op.

That is the whole integration, and the resulting **spectrum of glue cost across four frameworks —
nothing for plain custom elements, one predicate for Vue, one package for React, eleven directives for
Angular** — is a result of the project rather than an inconsistency in it. It reframes the two binding
packages as compensation for framework defects instead of a per-framework tax.

The Vue types live *here*, not in `@micro-medic/design-system`. That package depends on `lit` and
nothing else, which is what lets five consumers in four frameworks share it; a `GlobalComponents`
interface there would make every consumer depend on Vue's types.

## What replaced the placeholder

This was the last plain-JS *feature* micro-frontend (the shell followed), and it rendered a static list. It also
carried the hand-rolled HTTP and auth code CLAUDE.md flags as the real debt in the legacy packages:

| Before | Now |
|---|---|
| `const API_BASE = 'http://localhost:8080'` | `createService('api/diseases')` — one shared axios instance |
| `headers = token ? { Authorization: 'Bearer ' + token } : {}` | the client's request interceptor |
| a 401 went unnoticed | the response interceptor fires `onUnauthorized` → `authStore.logout()` |
| `eventBus.emit('ICD10_DISEASE_SELECTED', …)` — a raw string | `EventTypes.ICD10_DISEASE_SELECTED` |
| own `debounce()` with `.cancel()`, own `escapeHtml` + `ESCAPES` map | `useDebouncedRef`, and `{{ }}` |
| consumed `shared_store` as a federated *remote* | imports the four `@micro-medic/*` packages as sources |
| harness loaded the shell's `remoteEntry.js` from :3001 | harness loads no container at all |

The multi-framework mix is a goal of this project, not debt — porting the legacy MFEs to React 19 is
explicitly not wanted. Porting *this* one to a fourth framework keeps that intact while paying off the
part that genuinely was debt.

## The split

The doctor works in the `examination` form across three quarters of the screen. This pane is the
remaining quarter, where they search the catalogue and select a diagnosis.

The two are coupled by exactly one thing: `ICD10_DISEASE_SELECTED` on the shared bus. Neither package
imports the other — neither *can* name a symbol from the other — so either can be redeployed while
the other keeps running. In this package that coupling is one function, `select()` in
`state/catalogue.store.ts`. Being in different frameworks is what makes "the composition boundary is
the browser" falsifiable rather than merely asserted.

The 3:1 geometry is **not in this package**. It is `.mm-split--primary` in the design system, applied
by the shell around the two mount points. A fragment renders into its own mount point and cannot see
the screen it shares, so a remote claiming a share of the width would be imposing a layout on a
sibling it cannot observe.

**Clearing a selection publishes nothing.** `DiseaseSelectedPayload.disease` is not nullable, so this
bus carries no "deselected" message, and inventing one would change a contract a sibling remote
depends on. `examination` owns its own diagnosis field and its own Clear button; the button here only
forgets which row is highlighted. That asymmetry is deliberate and visible rather than papered over.

## Lifecycles are hand-written

`src/ICD10.ts` exports `bootstrap`/`mount`/`unmount` with no `single-spa-vue` and no
`import 'single-spa'`. single-spa's contract is three functions returning promises, and
`createApp().mount()` / `app.unmount()` already is that pair — there is no adapter to share a
dependency with in the first place.

`app.mount(hostElement)` takes an **element**, never a selector. A selector would be resolved against
the whole document, so two mounts — or one remount racing an incomplete teardown — could attach to an
element belonging to someone else. Same reason `examination` uses `createComponent({ hostElement })`
rather than `bootstrapApplication`.

**Teardown order is store, then app.** The store is created *outside* the Vue app (so `ICD10.ts` can
provide it to the tree), which means it has its own `effectScope` and nothing in Vue's teardown knows
about it. Its debounce timer and its auth-store subscription are exactly the two things that would
leak — and single-spa unmounts this application on every route change away from `/examination`, so
"leaks once per navigation" is the default failure mode here, not an edge case.

## Two searches, not one

`GET /api/diseases` and `GET /api/diseases/search` are kept as separate methods on
`DiseaseCatalogue`, and a blank term routes to the first. `DiseaseRepository.search` interpolates its
parameter into two `LIKE LOWER(CONCAT('%', :query, '%'))` clauses with **no null guard**, so a blank
query is not "match everything" — it is a different query with a different result. One place decides
between them: `load()` in the store.

Note also that `Disease`'s id is the ICD-10 code itself (`A00.1`), a `String` — the one place this API
differs from every other collection, and the reason `DiseaseListItem` is keyed by `code`.

## No query library

`calendar` uses TanStack Query because it has a genuine cache problem. This MFE issues one kind of
read and shows the result once. `composables/useAsyncState.ts` is the forty lines that keep the three
disciplines a query library would have enforced for free:

1. never render "empty" while a request is in flight — hence `isInitialLoading`, not `isLoading`;
2. keep the last good data visible during a refresh instead of flashing a spinner (the list dims);
3. drop a superseded response.

The third is **not** the debounce. Two requests that both clear a 300 ms debounce can still land out
of order, and then a fast search for "asp" returning before a slow one for "as" leaves the pane
showing results for text already replaced. `useDebouncedRef` and the sequence number in
`useAsyncState` solve different halves of the same bug; conflating them is how the classic
autocomplete defect survives a fix.

`shallowRef` for the data, not `ref`, and that has a correctness edge as well as a cost one: a
deeply-reactive `ref` would hand a Vue reactive **proxy** to an Angular subscriber over the bus, which
is Vue leaking across the one boundary this architecture insists is just the browser.

## Highlighting returns data, not markup

`utils/highlight.ts` returns `{ text, match }` segments and the template renders them with `{{ }}`, so
Vue escapes every one. The obvious implementation — `replace(re, '<mark>$&</mark>')` through `v-html` —
would inject markup assembled from a backend value, and the descriptions come from an 8.6 MB seeded
JSON file nobody has read end to end. Matching is literal `indexOf` on lowercased copies rather than a
`RegExp`, because ICD-10 terms contain `.` and users type `(` and `+`.

## Auth, which gates nothing

`GET /api/diseases/**` is `permitAll` and server-side cached, so this pane works fully signed out —
one of the few in the application that does. The store still watches the token, for staleness rather
than access: a page fetched under the previous session, and especially a diagnosis selected under it,
would be misleading after a sign-out, so both are dropped. Watching the store covers login, logout
*and* the cross-tab `storage` case in one subscription, where the previous implementation needed two
bus listeners.

## Five list states, resolved in one place

`DiseaseList` decides between them, and they are exhaustive: initial load, error, no-matches,
empty-catalogue, results. Two would otherwise be conflated — an empty search result and an empty
catalogue are identical in the data and mean completely different things. The second is not a failed
query, it is an unseeded database (`icd10_codes.json` loads only from `POST /api/seeder/disease`, which
is manual and dev-profile-only), so the empty state says so and turns a mystifying blank pane into an
instruction.

The error branch is checked *before* the empty branch on purpose: `useAsyncState` keeps the last good
data when a request fails, so a failed refresh has both an error and rows. Rows that are quietly out
of date are worse than rows that are labelled as such.

## Typecheck is `vue-tsc`

```sh
yarn workspace icd10 typecheck     # vue-tsc --noEmit
```

Not `tsc --noEmit`. `tsc` compiles the TypeScript and never looks at a template, so every `mm-*`
binding would go unchecked — the same reason `examination`'s `typecheck` runs `ngc`. `.vue` is also
listed explicitly in `tsconfig.json`'s `include`, because `include` matches by extension and a pattern
that matches nothing is not an error, it is a template nobody checks.

`eslint.config.mjs` has a `**/*.vue` block using `vue-eslint-parser` for the same class of reason:
ESLint has no default handler for `.vue`, so without it these components would be silently unlinted.

## Running it standalone

```sh
yarn workspace icd10 start     # webpack --watch
yarn workspace icd10 serve     # serve dist -p 3002
```

`http://localhost:3002` is the dev harness, and it plays the other half of the split: it subscribes to
`ICD10_DISEASE_SELECTED` and logs what this pane publishes, so if a code appears in the log when a row
is clicked, the Angular form next door will receive it too. It boots through `createIcd10App()` — the
same factory the federated mount uses — so what runs there is the real thing rather than a lookalike.
The 3:1 ratio is restated in the page's own CSS rather than imported, so the harness cannot become a
second definition of the layout.

The harness also shows auth state and offers a Sign out button, which exercises the store's session
watcher. That is worth having here specifically because this is one of the few panes that works
anonymously: "the list is empty" and "the session expired" need to be tellable apart.

A running backend at `http://localhost:8080` is required, **with a seeded disease table** —
`POST /api/seeder/disease` (dev profile, authenticated). Without it the pane shows the
empty-catalogue state, correctly.

## File map

| Path | What it is |
|---|---|
| `src/ICD10.ts` | Federated entry: hand-written single-spa lifecycles, `createIcd10App`, the `errorHandler` blast radius |
| `src/ICD10App.vue` | Root component — composes four children, owns no state |
| `src/state/catalogue.store.ts` | Search, paging, selection, and the one `eventBus.emit` |
| `src/state/injection-keys.ts` | Typed `InjectionKey` + `useCatalogueStore()`, which throws rather than rendering blank |
| `src/composables/useAsyncState.ts` | Loading/error/data holder with the out-of-order guard |
| `src/composables/useDebouncedRef.ts` | 300 ms debounce as a ref, disposed with the scope |
| `src/composables/useAuthState.ts` | Vue bridge over the shared auth store |
| `src/services/disease.service.ts` | `createService` wrapper; the only file that knows a path |
| `src/components/` | Search field, list, list item, pager, selected-diagnosis echo |
| `src/utils/highlight.ts` | Search-term segmentation — data, not markup |
| `src/utils/error-message.ts` | `ApiError` → doctor-readable text |
| `src/types/design-system.d.ts` | `GlobalComponents` for the `mm-*` tags — the Vue "binding layer", such as it is |
