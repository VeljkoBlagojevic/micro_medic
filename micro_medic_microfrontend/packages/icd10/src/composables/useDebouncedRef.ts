import { onScopeDispose, ref, watch, type Ref } from 'vue';

/**
 * Mirrors `source`, but only after it has been still for `delayMs`.
 *
 * Returned as a *ref* rather than as a callback wrapper, which is the shape that suits Vue: the
 * consumer watches the debounced ref and never has to hold a timer handle or remember to cancel it.
 * That is the whole reason this is fifteen lines here and was a `debounce(fn, ms)` helper with its
 * own `.cancel()` in the previous plain-JS implementation.
 *
 * Why debounce at all: the catalogue is ~71,700 rows behind a `LIKE '%…%'` on two columns, so a
 * request per keystroke is both a wasted round trip and a query the database has to run. 300 ms is
 * the same interval `examination`'s medicine search uses — long enough to swallow a burst of typing,
 * short enough that the pane does not feel stalled.
 *
 * **This is not the out-of-order guard.** Two requests that both clear this debounce can still land
 * in the wrong order; that is `useAsyncState`'s sequence number, and the two solve different halves
 * of the same bug. Conflating them is how the classic autocomplete defect survives a fix.
 *
 * `onScopeDispose` rather than `onUnmounted`: an effect scope is what a composable can rely on, and
 * this one is also used from a scope that is not a component. single-spa unmounts this application
 * on every route change away from `/examination`, so "leaks once per navigation" is the default
 * failure mode here, not an edge case — the same reason `examination` registers its teardown through
 * `DestroyRef`.
 */
export function useDebouncedRef<T>(source: Ref<T>, delayMs = 300): Ref<T> {
    const debounced = ref(source.value) as Ref<T>;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cancel = (): void => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    };

    watch(source, (value) => {
        cancel();
        timer = setTimeout(() => {
            timer = null;
            debounced.value = value;
        }, delayMs);
    });

    onScopeDispose(cancel);

    return debounced;
}
