export interface DebouncedFn<A extends any[], R> {
    (...args: A): void;
    cancel(): void;
}

export function debounce<A extends any[], R>(func: (...args: A) => R, wait: number): DebouncedFn<A, R> {
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