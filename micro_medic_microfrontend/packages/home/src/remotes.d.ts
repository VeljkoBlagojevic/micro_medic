import type { LifeCycles } from 'single-spa';

/**
 * The federated module specifiers, declared so a typo in one is a **compile error** rather than a blank
 * region.
 *
 * Every specifier below is a key of `remotes` in `webpack.config.js` joined to a key of that remote's
 * own `exposes`. Neither half exists on disk here — webpack resolves them at runtime from the
 * container — so without these declarations `import('nav/Header')` is an unresolved module, and with a
 * loose `declare module 'nav/*'` a mistyped `import('nav/Heder')` would typecheck happily and fail as a
 * rejected promise in the browser. One declaration per exposed module is the point: the list is short,
 * it changes only when a remote's public surface does, and it is the only place in the shell where the
 * remotes' *names* are checked at all.
 *
 * Adding a remote is still two edits in this package — the `REMOTES` map in `webpack.config.js` and an
 * entry in `src/routes.ts` — plus a third here if it exposes something new.
 *
 * `LifeCycles` comes from `single-spa` rather than being restated: it is what `registerApplication`
 * accepts, so borrowing it is what makes `routes.ts`'s `load` functions type-check against the router
 * instead of merely against a lookalike of it. Indexed access (`LifeCycles['mount']`) keeps each named
 * export honest about the fact that a remote exports three *functions*, not one object.
 */

declare module 'nav/Header' {
    export const bootstrap: LifeCycles['bootstrap'];
    export const mount: LifeCycles['mount'];
    export const unmount: LifeCycles['unmount'];
}

declare module 'nav/Footer' {
    export const bootstrap: LifeCycles['bootstrap'];
    export const mount: LifeCycles['mount'];
    export const unmount: LifeCycles['unmount'];
}

declare module 'notifications/Notifications' {
    export const bootstrap: LifeCycles['bootstrap'];
    export const mount: LifeCycles['mount'];
    export const unmount: LifeCycles['unmount'];
}

declare module 'auth/Auth' {
    export const bootstrap: LifeCycles['bootstrap'];
    export const mount: LifeCycles['mount'];
    export const unmount: LifeCycles['unmount'];
}

declare module 'calendar/Calendar' {
    export const bootstrap: LifeCycles['bootstrap'];
    export const mount: LifeCycles['mount'];
    export const unmount: LifeCycles['unmount'];
}

declare module 'examination/Examination' {
    export const bootstrap: LifeCycles['bootstrap'];
    export const mount: LifeCycles['mount'];
    export const unmount: LifeCycles['unmount'];
}

declare module 'icd10/ICD10' {
    export const bootstrap: LifeCycles['bootstrap'];
    export const mount: LifeCycles['mount'];
    export const unmount: LifeCycles['unmount'];
}
