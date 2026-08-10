import { computed, signal, type Signal } from '@angular/core';

/** The four states any one-shot read can be in. */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * A tiny loading/error/data holder, and the reason this package has no TanStack Query.
 *
 * `calendar` uses TanStack Query because it has a *cache* problem: several components read the same
 * appointment list, mutations must invalidate it, and the detail pane derives its DTO from the
 * cache by id so it cannot show a stale snapshot. None of that applies here. This MFE issues
 * short-lived reads whose results are shown once — a medicine search the doctor is typing, the
 * patient's history pane — and one command. A `QueryClientProvider` would add a shared federation
 * singleton and an invalidation graph to manage, in exchange for a cache nothing reads twice.
 *
 * What is genuinely needed is the discipline TanStack Query enforces for free and hand-rolled
 * loading flags usually get wrong: never render "empty" while a request is in flight, keep the last
 * good data visible during a refresh instead of flashing a spinner, and drop the response of a
 * request that has been superseded. All three are below, in about forty lines.
 */
export interface AsyncState<T> {
    readonly status: Signal<AsyncStatus>;
    readonly data: Signal<T | null>;
    readonly error: Signal<string | null>;
    readonly isLoading: Signal<boolean>;
    /**
     * True only when loading with nothing to show yet, which is the sole case that warrants a
     * spinner. A refresh that has stale data keeps rendering it — replacing a populated list with
     * a spinner on every keystroke is the flicker that makes search feel broken.
     */
    readonly isInitialLoading: Signal<boolean>;
    readonly isEmpty: Signal<boolean>;
}

export interface AsyncStateController<T> extends AsyncState<T> {
    /**
     * Runs `operation`, tracking status and mapping any throw through `toMessage`.
     *
     * Concurrency-safe by sequence number: if `run` is called again before the first settles, the
     * earlier response is discarded when it arrives. Without this, a fast search for "asp" landing
     * after a slow one for "as" would leave the list showing results for text the doctor has
     * already replaced — the classic out-of-order autocomplete bug.
     */
    run(operation: () => Promise<T>, toMessage: (error: unknown) => string): Promise<void>;
    set(value: T): void;
    reset(): void;
}

export function createAsyncState<T>(isEmptyValue: (value: T) => boolean): AsyncStateController<T> {
    const status = signal<AsyncStatus>('idle');
    const data = signal<T | null>(null);
    const error = signal<string | null>(null);

    let sequence = 0;

    const isLoading = computed(() => status() === 'loading');

    return {
        status: status.asReadonly(),
        data: data.asReadonly(),
        error: error.asReadonly(),
        isLoading,
        isInitialLoading: computed(() => status() === 'loading' && data() === null),
        isEmpty: computed(() => {
            const value = data();
            return status() === 'success' && value !== null && isEmptyValue(value);
        }),

        async run(operation, toMessage) {
            const ticket = ++sequence;
            status.set('loading');
            error.set(null);

            try {
                const value = await operation();
                if (ticket !== sequence) return;
                data.set(value);
                status.set('success');
            } catch (thrown) {
                if (ticket !== sequence) return;
                // Keep `data` as it was: an error state that still shows the last good result is
                // more useful than one that blanks the pane the doctor was reading.
                error.set(toMessage(thrown));
                status.set('error');
            }
        },

        set(value: T) {
            // Bump the sequence so an in-flight response cannot overwrite a value set directly.
            sequence++;
            data.set(value);
            error.set(null);
            status.set('success');
        },

        reset() {
            sequence++;
            data.set(null);
            error.set(null);
            status.set('idle');
        },
    };
}

/** `createAsyncState` for a list, with the usual emptiness test. */
export function createAsyncListState<T>(): AsyncStateController<readonly T[]> {
    return createAsyncState<readonly T[]>((value) => value.length === 0);
}
