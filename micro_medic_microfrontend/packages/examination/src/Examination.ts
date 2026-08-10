import {
    createComponent,
    ErrorHandler,
    provideZonelessChangeDetection,
    type ApplicationRef,
    type ComponentRef,
    type Provider,
} from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { ExaminationApp } from './ExaminationApp.js';

/**
 * Federated entry point — single-spa lifecycles for an Angular application, written by hand.
 *
 * There is no `single-spa-angular` here, and no `import 'single-spa'` either. Both would be a
 * dependency this package does not need: single-spa's contract is three functions returning
 * promises, and Angular's own bootstrap already gives us exactly that. Skipping the adapter also
 * keeps this remote clear of the repo's v5/v6 split — the shell is on single-spa 5 while the modern
 * MFEs are on 6, and a package that imports neither cannot be caught between them.
 *
 * `createApplication` + `createComponent` rather than `bootstrapApplication`, and the difference is
 * the reason: `bootstrapApplication` finds its host by running the root component's selector against
 * the *document*, which is the one thing a micro-frontend must not do. Two Angular remotes, or one
 * remount racing an incomplete teardown, and it can attach to an element that belongs to someone
 * else. `createComponent` takes the host element explicitly, so this application can only ever
 * render into the div the shell handed it.
 *
 * `provideZonelessChangeDetection` is the other deliberate omission made visible: there is no
 * `zone.js` in this package's dependencies and none in the federation shared scope. `zone.js`
 * monkey-patches `setTimeout`, `Promise` and `addEventListener` *globally*, which in a shared
 * document means an Angular remote quietly changing the runtime underneath React 19, Vue 3, Lit and
 * two plain-custom-element MFEs — Vue included, since `icd10` shares this screen. Signals and
 * `OnPush` make it unnecessary, so every component here uses them.
 */

/** The mount point the shell provides — see `home/public/index.html`. */
const HOST_ID = 'single-spa-application:examination';

/**
 * A tag single-spa's own mount div does not have.
 *
 * When the shell has no `#single-spa-application:NAME` div, single-spa appends one to `<body>` —
 * which is how a remote ends up outside the layout. This MFE is the wide half of a two-column split,
 * so being appended to the body would break the composition silently. Hence the labelled fallback
 * below, which says so out loud instead.
 */
const FALLBACK_ID = 'examination-mfe-fallback-root';

/**
 * Providers shared by the federated and standalone entry points.
 *
 * Exported so `standalone.ts` boots the *same* application rather than a lookalike. A dev harness
 * that configures its own providers stops being evidence about the real thing.
 */
export const examinationProviders: Provider[] = [
    provideZonelessChangeDetection(),
    {
        /*
         * The blast radius, and the Angular counterpart of the `errorBoundary` that
         * `singleSpaReact` gives `calendar` and `auth`.
         *
         * Without it an uncaught error propagates out of change detection and through single-spa's
         * mount, taking down the shell and every sibling micro-frontend with it. A failure in this
         * remote has to stay inside this remote — that containment is the operational claim the
         * whole architecture rests on, so it cannot be left to chance.
         *
         * It only logs. Replacing the view from inside an `ErrorHandler` is not safe, and it is not
         * where recoverable failures belong anyway: those are the components' own `mm-error-state`
         * and inline submit error. This is the net underneath them.
         */
        provide: ErrorHandler,
        useValue: {
            handleError(error: unknown): void {
                console.error('[examination] Uncaught error, contained to this MFE:', error);
            },
        } satisfies ErrorHandler,
    },
];

/** The live application and its root component, between `mount` and `unmount`. */
let appRef: ApplicationRef | null = null;
let componentRef: ComponentRef<ExaminationApp> | null = null;

/**
 * single-spa's `bootstrap` is intentionally a no-op.
 *
 * Angular's bootstrap *renders*, so doing it here would put the form on screen before single-spa had
 * decided this application should be active — possibly on a route where it never becomes active.
 */
export function bootstrap(): Promise<void> {
    return Promise.resolve();
}

export async function mount(): Promise<void> {
    // Defensive, not theoretical: single-spa calls `mount` again after a failed `unmount`, and two
    // component refs on one host means two forms sharing one draft store.
    if (appRef) return;

    const host = resolveHost();
    const app = await createApplication({ providers: examinationProviders });

    try {
        const ref = createComponent(ExaminationApp, {
            environmentInjector: app.injector,
            hostElement: host,
        });
        // Without `attachView` the component exists but is not part of any change-detection pass,
        // so it renders once and then never updates — the signals would fire into nothing.
        app.attachView(ref.hostView);

        appRef = app;
        componentRef = ref;
    } catch (error) {
        // The application was created before the failure, so it has to be destroyed here or its
        // injector (and the auth-store subscription inside it) outlives a mount that never happened.
        app.destroy();
        throw error;
    }
}

export async function unmount(): Promise<void> {
    const app = appRef;
    const component = componentRef;
    // Cleared first, so a throw during teardown cannot leave stale refs that make `mount` return
    // early and render nothing on the next visit to `/examination`.
    appRef = null;
    componentRef = null;

    component?.destroy();
    app?.destroy();

    /*
     * Every teardown this package needs rides on those two calls. `DestroyRef.onDestroy` unsubscribes
     * the auth-store bridge, the three event-bus listeners in `ExaminationDraftStore` and the pending
     * debounce timer in the medicine search. That is why they were registered through `DestroyRef` in
     * the first place: single-spa unmounts this application on every route change away from
     * `/examination`, so "leaks once per navigation" is the default failure mode here, not an edge
     * case.
     */
    await Promise.resolve();
}

/**
 * Finds the shell's mount point, or creates a labelled fallback.
 *
 * Reusing an existing `<exam-root>` matters: single-spa's div survives unmount, so appending a fresh
 * one on every remount would stack dead hosts inside it.
 */
function resolveHost(): HTMLElement {
    const container =
        document.getElementById(HOST_ID) ??
        document.getElementById(FALLBACK_ID) ??
        createFallbackContainer();

    const existing = container.querySelector('exam-root');
    if (existing) return existing as HTMLElement;

    const root = document.createElement('exam-root');
    container.appendChild(root);
    return root;
}

function createFallbackContainer(): HTMLElement {
    console.warn(
        `[examination] #${HOST_ID} not found — the shell should provide it (see home/public/index.html). ` +
            'Rendering into a fallback appended to <body>, which will not be inside the split layout.'
    );
    const container = document.createElement('div');
    container.id = FALLBACK_ID;
    document.body.appendChild(container);
    return container;
}
