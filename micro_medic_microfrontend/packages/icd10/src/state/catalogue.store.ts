import { computed, effectScope, ref, watch, type ComputedRef, type Ref } from 'vue';
import { EventTypes, eventBus } from '@micro-medic/shared-store';
import type { DiseaseDto, Page } from '@micro-medic/shared-types';
import { PAGE_SIZE, diseaseService, type DiseaseCatalogue } from '../services/disease.service.js';
import { useAsyncState, type AsyncState } from '../composables/useAsyncState.js';
import { useDebouncedRef } from '../composables/useDebouncedRef.js';
import { useAuthState } from '../composables/useAuthState.js';
import { catalogueErrorMessage } from '../utils/error-message.js';

/**
 * The application's state, in one place, with its dependencies handed in.
 *
 * `examination` reached for an injector-scoped store for a reason this package shares: the value the
 * screen is *about* arrives from, and departs to, somewhere the components cannot name. There, the
 * appointment and the diagnosis come in over the bus; here, the selection goes *out* over it. A
 * component that owned the selection would also have to own the publish, and then two components
 * showing the same selection would need to agree about who publishes — so the store owns it and the
 * components render it.
 *
 * The store is created per mounted application rather than at module scope, which matters in a
 * federated document: a module-level singleton would survive `unmount`, so navigating away from
 * `/examination` and back would restore a search from the previous visit — and, worse, two mounts
 * would share one selection. `provide`/`inject` scopes it to the app instance, the same shape as
 * Angular's injector scope in the sibling MFE.
 *
 * ### Dependencies are parameters
 *
 * `catalogue` is a `DiseaseCatalogue`, not the concrete axios-backed service. The store depends on
 * the two-method read interface, and `createCatalogueStore()` supplies the real implementation by
 * default — so the abstraction costs nothing at the call site and the store can be driven by a stub
 * the day this repo grows a test setup. That direction of dependency is also why this file imports no
 * URL and no axios.
 */
export interface CatalogueStoreDeps {
    catalogue?: DiseaseCatalogue;
    /** Debounce interval. A parameter so a harness or a test can collapse it to zero. */
    debounceMs?: number;
}

export interface CatalogueStore {
    /** Bound to the search field. Written by the component, debounced internally. */
    readonly query: Ref<string>;
    /** Zero-based, matching Spring's `Page.number`. */
    readonly page: ComputedRef<number>;
    readonly pageState: AsyncState<Page<DiseaseDto>>;
    readonly diseases: ComputedRef<readonly DiseaseDto[]>;
    readonly totalElements: ComputedRef<number>;
    readonly totalPages: ComputedRef<number>;
    readonly isFirstPage: ComputedRef<boolean>;
    readonly isLastPage: ComputedRef<boolean>;
    /** True while the field holds text the debounce has not yet acted on. */
    readonly isTyping: ComputedRef<boolean>;
    readonly isSearching: ComputedRef<boolean>;
    readonly selected: Readonly<Ref<DiseaseDto | null>>;

    select(disease: DiseaseDto): void;
    clearSelection(): void;
    clearQuery(): void;
    goToPage(page: number): void;
    nextPage(): void;
    previousPage(): void;
    retry(): void;
    /** Releases the watchers and subscriptions. Called by `unmount`. */
    dispose(): void;
}

export function createCatalogueStore(deps: CatalogueStoreDeps = {}): CatalogueStore {
    const catalogue = deps.catalogue ?? diseaseService;
    const debounceMs = deps.debounceMs ?? 300;

    /*
     * One scope owning every watcher and subscription this store creates.
     *
     * A composable called outside a component's lifecycle (`useAuthState`, `useDebouncedRef`) has no
     * component to be torn down with, so its `onScopeDispose` would never fire and the auth
     * subscription would outlive the application. Running the setup inside an explicit
     * `effectScope` gives them one owner, and `dispose()` collapses all of it at once — the direct
     * counterpart of `examination` hanging its teardown on `DestroyRef`.
     */
    const scope = effectScope();

    const store = scope.run(() => {
        const query = ref('');
        const page = ref(0);
        const selected = ref<DiseaseDto | null>(null);

        const debouncedQuery = useDebouncedRef(query, debounceMs);
        const auth = useAuthState();
        const pageState = useAsyncState<Page<DiseaseDto>>((value) => value.content.length === 0);

        /** The current term, normalised the way the decision below needs it. */
        const term = computed(() => debouncedQuery.value.trim());

        async function load(): Promise<void> {
            const searchTerm = term.value;
            const requestedPage = page.value;

            await pageState.run(
                () =>
                    /*
                     * Blank goes to `list`, not to `search` with an empty parameter.
                     *
                     * `DiseaseRepository.search` interpolates the term into two
                     * `LIKE LOWER(CONCAT('%', :query, '%'))` clauses with no null guard, so a blank
                     * query is not "match everything" — it is a different query. The endpoints are
                     * genuinely two operations and `disease.service.ts` keeps them so; this is the
                     * one place that decides between them.
                     */
                    searchTerm
                        ? catalogue.search(searchTerm, requestedPage)
                        : catalogue.list(requestedPage),
                catalogueErrorMessage
            );
        }

        /*
         * A new term means page 0. Without this, typing while on page 4 of the unfiltered catalogue
         * would request page 4 of a result set that may have one page — Spring answers with an empty
         * page and the pane would read as "no matches" for a term that has plenty.
         *
         * Resetting `page` here rather than inside the loader keeps the two triggers independent:
         * the watcher below fires for a page change *or* a term change, and each does one thing.
         */
        watch(term, () => {
            page.value = 0;
        });

        watch(
            [term, page],
            () => {
                void load();
            },
            // `immediate` is the initial load. The pane opens showing the catalogue rather than an
            // empty box: a doctor who does not know what they are looking for still sees that this
            // is a searchable list of codes.
            { immediate: true }
        );

        /*
         * A change of session reloads, and drops the selection.
         *
         * Not authorisation — `GET /api/diseases/**` is `permitAll`, so this pane works signed out
         * and the token changes nothing about what it may read. It is about staleness: a list
         * fetched under the previous session, and especially a diagnosis chosen under it, would be
         * misleading after a sign-out. The previous implementation reloaded on `AUTH_LOGIN`/
         * `AUTH_LOGOUT` bus events for the same reason; watching the store covers both plus the
         * cross-tab `storage` case, and it is one subscription instead of two.
         */
        watch(
            () => auth.value.token,
            () => {
                clearSelection();
                void load();
            }
        );

        function select(disease: DiseaseDto): void {
            selected.value = disease;
            /*
             * The entire outbound contract of this micro-frontend, in one line.
             *
             * `examination` cannot name a symbol in this package and this package cannot name one in
             * `examination`; the event is the only thing they share, so either can be redeployed
             * while the other keeps running. `EventTypes.ICD10_DISEASE_SELECTED` rather than the
             * string literal the previous implementation emitted — a typo in a string is a listener
             * that silently never fires, and here it would look exactly like a broken split.
             *
             * The payload is the DTO as the backend sent it. `shallowRef` in `useAsyncState` is what
             * keeps that true: a deeply-reactive `ref` would hand a Vue proxy to an Angular
             * subscriber, which is Vue leaking across the one boundary this architecture claims is
             * just the browser.
             */
            eventBus.emit(EventTypes.ICD10_DISEASE_SELECTED, { disease });
        }

        function clearSelection(): void {
            selected.value = null;
            /*
             * Deliberately silent — no event.
             *
             * `DiseaseSelectedPayload.disease` is not nullable, so there is no "deselected" message
             * this bus can carry, and inventing one would be a contract change affecting a remote
             * that cannot see this file. `examination` owns its own diagnosis field and has its own
             * Clear button for it; this only forgets which row is highlighted here. Making that
             * asymmetry visible is better than papering over it: the receiver decides what to keep.
             */
        }

        function goToPage(next: number): void {
            const total = pageState.data.value?.totalPages ?? 0;
            // Clamped rather than trusted: `nextPage` on the last page and a stale click after the
            // result set shrank both arrive here, and requesting page 12 of 3 returns an empty page
            // that reads as "no matches".
            if (next < 0 || (total > 0 && next >= total)) return;
            if (next === page.value) return;
            page.value = next;
        }

        const diseases = computed<readonly DiseaseDto[]>(() => pageState.data.value?.content ?? []);
        const totalPages = computed(() => pageState.data.value?.totalPages ?? 0);

        return {
            query,
            page: computed(() => page.value),
            pageState,
            diseases,
            totalElements: computed(() => pageState.data.value?.totalElements ?? 0),
            totalPages,
            isFirstPage: computed(() => page.value === 0),
            isLastPage: computed(() => totalPages.value === 0 || page.value >= totalPages.value - 1),
            /*
             * The debounce made visible. `query` has changed but `debouncedQuery` has not caught up,
             * so a request is coming and none is in flight — a state neither `isLoading` nor `idle`
             * describes. Without it the pane looks frozen for 300 ms on every keystroke, which is
             * the exact interval a user notices as lag.
             */
            isTyping: computed(() => query.value !== debouncedQuery.value),
            isSearching: computed(() => term.value.length > 0),
            selected: selected as Readonly<Ref<DiseaseDto | null>>,

            select,
            clearSelection,
            clearQuery(): void {
                query.value = '';
            },
            goToPage,
            nextPage(): void {
                goToPage(page.value + 1);
            },
            previousPage(): void {
                goToPage(page.value - 1);
            },
            retry(): void {
                void load();
            },
            dispose(): void {
                scope.stop();
            },
        } satisfies CatalogueStore;
    });

    // `scope.run` returns `undefined` only if the scope was already stopped, which cannot be true of
    // one created two statements ago. The assertion documents that rather than inviting a null check
    // for a state the code makes unreachable.
    return store as CatalogueStore;
}

export { PAGE_SIZE };
