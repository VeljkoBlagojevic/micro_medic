import { computed, ref, shallowRef, type ComputedRef, type Ref } from 'vue';

/** The four states any one-shot read can be in. Mirrors `examination/src/state/async-state.ts`. */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * A loading/error/data holder, and the reason this package has no data-fetching library.
 *
 * The same forty lines `examination` keeps in `state/async-state.ts`, expressed in Vue refs instead
 * of Angular signals — deliberately, because the *discipline* is what matters and it is not a
 * framework feature. `calendar` uses TanStack Query because it has a genuine cache problem: several
 * components read one appointment list, mutations invalidate it, and the detail pane derives its DTO
 * from the cache by id. None of that is true here. This MFE issues one kind of read, shows the
 * result once, and publishes a selection on the bus.
 *
 * What a query library would give for free, and hand-rolled loading flags almost always get wrong:
 *
 *  1. never render "empty" while a request is in flight — hence `isInitialLoading` rather than
 *     `isLoading` at the call site;
 *  2. keep the last good data visible during a refresh instead of flashing a spinner;
 *  3. drop the response of a request that has been superseded.
 *
 * The third is the one worth reading the code for. It is **not** the debounce: two requests that
 * both clear a 300 ms debounce can still land out of order, and then a fast search for "asp"
 * returning before a slow one for "as" leaves the pane showing results for text the doctor has
 * already replaced. The sequence number is what makes that impossible.
 */
export interface AsyncState<T> {
    readonly status: Readonly<Ref<AsyncStatus>>;
    readonly data: Readonly<Ref<T | null>>;
    readonly error: Readonly<Ref<string | null>>;
    readonly isLoading: ComputedRef<boolean>;
    /**
     * True only while loading with nothing to show yet, which is the only case that warrants a
     * spinner. A refresh that still has data keeps rendering it — replacing a populated list with a
     * spinner on every keystroke is the flicker that makes a search field feel broken.
     */
    readonly isInitialLoading: ComputedRef<boolean>;
    readonly isEmpty: ComputedRef<boolean>;
}

export interface AsyncStateController<T> extends AsyncState<T> {
    run(operation: () => Promise<T>, toMessage: (error: unknown) => string): Promise<void>;
    set(value: T): void;
    reset(): void;
}

export function useAsyncState<T>(isEmptyValue: (value: T) => boolean): AsyncStateController<T> {
    const status = ref<AsyncStatus>('idle');
    /*
     * `shallowRef`, not `ref`. `ref` deep-reactifies its value, which for a page of DTOs means
     * walking every object and replacing it with a proxy on every assignment. Nothing here mutates
     * a disease in place — a new response replaces the whole value — so the deep conversion is pure
     * cost, and it has a correctness edge too: a proxied DTO is not the object the backend sent, and
     * this package publishes one over the event bus to a *different framework*. A subscriber in
     * Angular receiving a Vue reactive proxy would be an implementation detail leaking across the
     * one boundary this architecture insists is just the browser.
     */
    const data = shallowRef<T | null>(null);
    const error = ref<string | null>(null);

    let sequence = 0;

    return {
        status,
        data,
        error,
        isLoading: computed(() => status.value === 'loading'),
        isInitialLoading: computed(() => status.value === 'loading' && data.value === null),
        isEmpty: computed(() => {
            const value = data.value;
            return status.value === 'success' && value !== null && isEmptyValue(value);
        }),

        async run(operation, toMessage) {
            const ticket = ++sequence;
            status.value = 'loading';
            error.value = null;

            try {
                const value = await operation();
                if (ticket !== sequence) return;
                data.value = value;
                status.value = 'success';
            } catch (thrown) {
                if (ticket !== sequence) return;
                // `data` is left as it was: an error state that still shows the last good result is
                // more useful than one that blanks the pane the doctor was reading.
                error.value = toMessage(thrown);
                status.value = 'error';
            }
        },

        set(value: T) {
            // Bump the sequence so an in-flight response cannot overwrite a value set directly.
            sequence++;
            data.value = value;
            error.value = null;
            status.value = 'success';
        },

        reset() {
            sequence++;
            data.value = null;
            error.value = null;
            status.value = 'idle';
        },
    };
}
