import { onScopeDispose, readonly, ref, type Ref } from 'vue';
import { authStore, type AuthState } from '@micro-medic/shared-store';

/**
 * Vue bridge over the shared auth store.
 *
 * The store is a closure-based singleton with an imperative `subscribe(cb) => unsubscribe` API, and
 * it is deliberately framework-neutral: it is read from React (`calendar/src/state/useAuthState.ts`),
 * from Angular (`examination/src/state/auth.store.ts`), from two plain custom elements and now from
 * here. Each consumer writes the eight lines that adapt it to its own reactivity system, and *that*
 * is the property worth demonstrating — a store that needed a Vue plugin, a React context and an
 * Angular provider to be usable would not be shared state, it would be three integrations.
 *
 * Why this MFE cares about auth at all, given that `GET /api/diseases/**` is `permitAll`: it does
 * not gate anything. Signing in or out is a change of *session*, and a catalogue page fetched under
 * the previous one should not stay on screen afterwards — `createCatalogueStore` watches this ref's
 * `token` and reloads, clearing the selection, because a diagnosis chosen in a session that has ended
 * is stale advice.
 */
export function useAuthState(): Readonly<Ref<AuthState>> {
    const state = ref<AuthState>(authStore.getState());

    // `subscribe` hands back its own teardown, so it is already the right shape for the scope.
    onScopeDispose(
        authStore.subscribe((next) => {
            state.value = next;
        })
    );

    /*
     * Re-read after subscribing, not before: the store can change between the initial read and the
     * subscription landing (a 401 interceptor firing `logout`, or another tab's `storage` event), and
     * that window would otherwise leave this ref holding a snapshot no notification will ever
     * correct. Cheap to do, and the same reason `nav-app-bar` re-reads in `connectedCallback`.
     */
    state.value = authStore.getState();

    // `readonly` so a consumer cannot assign to it: the store is the single source of truth, and a
    // component writing here would produce state that disagrees with every other MFE.
    return readonly(state) as Readonly<Ref<AuthState>>;
}
