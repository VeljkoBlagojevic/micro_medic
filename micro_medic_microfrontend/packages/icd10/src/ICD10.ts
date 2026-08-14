import { createApp, type App } from 'vue';
// Side-effect import: reaching the design system registers every `mm-*` element. The pane renders
// `mm-input`, `mm-button`, `mm-spinner`, `mm-empty-state` and `mm-error-state`, so the tags must be
// defined before the first render.
import '@micro-medic/design-system';
import ICD10App from './ICD10App.vue';
import { createCatalogueStore, type CatalogueStore } from './state/catalogue.store.js';
import { catalogueStoreKey } from './state/injection-keys.js';
import './styles.css';

/**
 * Federated entry point — single-spa lifecycles for a Vue application, written by hand.
 *
 * There is no `single-spa-vue` here and no `import 'single-spa'` either, matching what `examination`
 * does for Angular and for the same two reasons. single-spa's contract is three functions returning
 * promises, and `createApp().mount()` / `app.unmount()` already is that pair.
 *
 * `app.mount(hostElement)` takes its host as an element, never a selector. That is the property that
 * matters in a shared document: a selector would be resolved against the whole page, so two mounts —
 * or one remount racing an incomplete teardown — could attach to an element belonging to someone
 * else. Passing the element the shell handed us makes that unrepresentable, which is exactly why
 * `examination` uses `createComponent({ hostElement })` rather than `bootstrapApplication`.
 */

/** The mount point the shell provides — see `home/public/index.html`. */
const HOST_ID = 'single-spa-application:icd10';

/**
 * A tag single-spa's own mount div does not have.
 *
 * When the shell has no `#single-spa-application:NAME` div, single-spa appends one to `<body>` —
 * which is how a remote ends up outside the layout. This MFE is the narrow half of a two-column
 * split, so being appended to the body would silently break the composition and look like a styling
 * bug. Hence the labelled fallback below, which says so out loud instead.
 */
const FALLBACK_ID = 'icd10-mfe-fallback-root';

/** The live application and its store, between `mount` and `unmount`. */
let appRef: App<Element> | null = null;
let storeRef: CatalogueStore | null = null;

/**
 * Creates the application and wires its dependencies.
 *
 * Exported so `standalone.ts` boots the *same* application rather than a lookalike. A dev harness
 * that assembles its own providers stops being evidence about the real thing — the same reason
 * `examination` exports `examinationProviders`.
 */
export function createIcd10App(): { app: App<Element>; store: CatalogueStore } {
    const store = createCatalogueStore();
    const app = createApp(ICD10App);

    /*
     * The blast radius, and the Vue counterpart of the `errorBoundary` `singleSpaReact` gives
     * `calendar` and the `ErrorHandler` provider in `examination`.
     *
     * Without it an uncaught error in a render or a watcher propagates out through single-spa's
     * mount and takes down the shell and every sibling micro-frontend with it. A failure in this
     * remote has to stay inside this remote; that containment is the operational claim the whole
     * architecture rests on, so it cannot be left to chance.
     *
     * It only logs. Replacing the view from inside an error handler is not safe, and it is not where
     * recoverable failures belong anyway — those are `DiseaseList`'s `mm-error-state`. This is the
     * net underneath them.
     */
    app.config.errorHandler = (error, _instance, info) => {
        console.error(`[icd10] Uncaught error (${info}), contained to this MFE:`, error);
    };

    // `provide` on the app rather than in a component's `setup`: the store outlives no component but
    // is created *before* the root one, and providing it here keeps `ICD10App` free of the wiring.
    app.provide(catalogueStoreKey, store);

    return { app, store };
}

/**
 * single-spa's `bootstrap` is intentionally a no-op.
 *
 * `createApp` is cheap but the store is not — its `immediate` watcher issues the first catalogue
 * request. Doing that here would fetch a page before single-spa had decided this application should
 * be active, possibly on a route where it never becomes active.
 */
export function bootstrap(): Promise<void> {
    return Promise.resolve();
}

export function mount(): Promise<void> {
    // Defensive, not theoretical: single-spa calls `mount` again after a failed `unmount`, and two
    // apps on one host means two panes publishing on the same bus event.
    if (appRef) return Promise.resolve();

    const host = resolveHost();
    const { app, store } = createIcd10App();

    try {
        app.mount(host);
        appRef = app;
        storeRef = store;
    } catch (error) {
        // The store was created before the failure, so its watchers and the auth subscription have
        // to be released here or they outlive a mount that never happened.
        store.dispose();
        app.unmount();
        throw error;
    }

    return Promise.resolve();
}

export function unmount(): Promise<void> {
    const app = appRef;
    const store = storeRef;
    // Cleared first, so a throw during teardown cannot leave stale refs that make `mount` return
    // early and render nothing on the next visit to `/examination`.
    appRef = null;
    storeRef = null;

    /*
     * Store before app. `app.unmount()` runs `onScopeDispose` for anything created inside a
     * component's setup, but this store was created *outside* the app — it has its own
     * `effectScope`, and nothing in Vue's teardown knows about it. Its debounce timer and its
     * auth-store subscription are exactly the two things that would leak, and single-spa unmounts
     * this application on every route change away from `/examination`, so "leaks once per
     * navigation" is the default failure mode here rather than an edge case.
     */
    store?.dispose();
    app?.unmount();

    return Promise.resolve();
}

/**
 * Finds the shell's mount point, or creates a labelled fallback.
 *
 * A fresh child element on every mount, rather than mounting into the container itself: `app.unmount`
 * empties its host, and single-spa's div is shared with nothing here — but mounting directly into a
 * div the shell owns means Vue clearing markup it did not create if that ever changes. Removing any
 * previous child first is what keeps a remount from stacking dead hosts.
 */
function resolveHost(): HTMLElement {
    const container =
        document.getElementById(HOST_ID) ??
        document.getElementById(FALLBACK_ID) ??
        createFallbackContainer();

    const existing = container.querySelector('icd10-root');
    if (existing) existing.remove();

    const root = document.createElement('icd10-root');
    container.appendChild(root);
    return root;
}

function createFallbackContainer(): HTMLElement {
    console.warn(
        `[icd10] #${HOST_ID} not found — the shell should provide it (see home/public/index.html). ` +
            'Rendering into a fallback appended to <body>, which will not be inside the split layout.'
    );
    const container = document.createElement('div');
    container.id = FALLBACK_ID;
    document.body.appendChild(container);
    return container;
}
