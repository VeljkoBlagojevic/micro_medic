/**
 * `unknown[]`, not `any[]`: the parameter list is only ever forwarded, never inspected, so
 * nothing here needs `any`'s assignability escape hatch.
 *
 * There is no `R` type parameter. The wrapper returns `void` because the call is deferred —
 * whatever `func` returns is produced after `debounce`'s caller has already moved on, so
 * threading a return type through would only promise a value that can never be delivered.
 */
export interface DebouncedFn<A extends unknown[]> {
    (...args: A): void;
    cancel(): void;
}

export function debounce<A extends unknown[]>(func: (...args: A) => unknown, wait: number): DebouncedFn<A> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedFunction = (...args: A): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = null;
            func(...args);
        }, wait);
    };

    debouncedFunction.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debouncedFunction;
}