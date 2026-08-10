import { inject, type InjectionKey } from 'vue';
import type { CatalogueStore } from './catalogue.store.js';

/**
 * Typed key for the one store this application provides.
 *
 * A `Symbol` rather than a string, and the reason is specific to a federated document: a string key
 * lives in a namespace shared by every `provide` in the app tree, and this MFE is mounted beside
 * others that Vue does not necessarily know about today but might tomorrow. A symbol cannot collide.
 *
 * `InjectionKey<T>` is what makes `inject(catalogueStoreKey)` return `CatalogueStore | undefined`
 * instead of `unknown`, which is the whole reason to declare a key at all rather than inject by
 * string.
 */
export const catalogueStoreKey: InjectionKey<CatalogueStore> = Symbol('icd10:catalogue-store');

/**
 * Injects the store, or throws.
 *
 * The throw is the point. `inject` returns `undefined` when nothing provided the key, and a
 * component that quietly renders an empty pane in that case is a bug that looks like a working
 * empty state — the hardest kind to notice in a micro-frontend, where "nothing rendered" is also
 * what a failed remote load looks like. Failing loudly means the app's `errorHandler` logs it and
 * the mistake is visible in development.
 *
 * Wrapping the inject in a function also keeps `catalogueStoreKey` out of every component: they ask
 * for the store, not for the mechanism that carries it.
 */
export function useCatalogueStore(): CatalogueStore {
    const store = inject(catalogueStoreKey);
    if (!store) {
        throw new Error(
            '[icd10] No catalogue store provided. ICD10App must provide `catalogueStoreKey` ' +
                'before any child component injects it.'
        );
    }
    return store;
}
