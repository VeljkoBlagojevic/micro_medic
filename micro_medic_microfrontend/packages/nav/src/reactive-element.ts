/**
 * The small amount of machinery a framework would otherwise provide.
 *
 * This package has no framework runtime on purpose (see `README.md`), which means re-rendering on
 * state change is ours to implement. It is about thirty lines, and writing them once here is what
 * keeps the two components themselves declarative.
 *
 * The contract for a subclass is deliberately narrow:
 *
 *   - implement `render()` — return the element's full inner HTML for the current state;
 *   - call `requestRender()` when state changes;
 *   - register listeners in `subscribe()` and return a teardown.
 *
 * `render()` returning a complete string rather than mutating nodes is the trade this class makes:
 * it is less efficient than surgical DOM updates, and for a nav bar of a dozen elements that does
 * not matter at all. What it buys is that the markup is a pure function of state, which is the
 * property that makes a UI easy to reason about — the same property React and Lit are bought for.
 * Where the trade would actually cost something (a list that re-renders while the user is typing
 * in it, or an animating toast) the component overrides this and patches in place instead.
 */
export abstract class ReactiveElement extends HTMLElement {
    /**
     * Teardowns collected from `subscribe()`, run on disconnect.
     *
     * A custom element can be moved in the DOM, which disconnects and reconnects it, so this must
     * be re-entrant: `disconnectedCallback` empties the list, and a later `connectedCallback`
     * re-subscribes from scratch. Leaking one store subscription per mount is exactly the bug
     * this indirection prevents — and in an always-mounted chrome MFE it would accumulate for as
     * long as the tab is open.
     */
    private teardowns: Array<() => void> = [];

    /** Coalesces bursts of state changes into one render. */
    private renderQueued = false;

    connectedCallback(): void {
        this.renderNow();
        this.teardowns = this.subscribe();
    }

    disconnectedCallback(): void {
        for (const teardown of this.teardowns) {
            try {
                teardown();
            } catch (error) {
                // A failing teardown must not prevent the others from running, or one bad
                // listener leaks every subscription after it.
                console.error('[nav] Error while tearing down a subscription:', error);
            }
        }
        this.teardowns = [];
    }

    /**
     * Register external listeners; return their teardowns.
     *
     * Called on connect, torn down on disconnect. Default is none.
     */
    protected subscribe(): Array<() => void> {
        return [];
    }

    /** The element's inner HTML for the current state. */
    protected abstract render(): string;

    /**
     * Hook for wiring up listeners on freshly rendered children, called after every render.
     *
     * Needed because `render()` replaces the subtree, so anything attached to the old nodes is
     * gone with them. Handlers here are delegated from the host instead (see `nav-app-bar`), which
     * survives re-render; this hook is for the cases that cannot be.
     */
    protected afterRender(): void {
        /* no-op by default */
    }

    /**
     * Schedules a render on the microtask queue.
     *
     * Coalescing matters more than it looks: `AUTH_LOGIN` triggers both a store notification and
     * a single-spa routing event, so a login would otherwise render this element twice in a row.
     */
    protected requestRender(): void {
        if (this.renderQueued) return;
        this.renderQueued = true;
        queueMicrotask(() => {
            this.renderQueued = false;
            // A state change can arrive in the same tick as a disconnect (a logout unmounts
            // things), so re-check rather than rendering into a detached element.
            if (this.isConnected) this.renderNow();
        });
    }

    private renderNow(): void {
        this.innerHTML = this.render();
        this.afterRender();
    }
}

const ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

/**
 * Escapes a value for interpolation into an HTML string.
 *
 * Not optional: `render()` builds markup by concatenation, and what it interpolates includes the
 * user's name and role, which arrive from the backend by way of the auth store. That crosses a
 * trust boundary — a patient's own surname is enough, since nothing between the registration form
 * and this string treats it as markup.
 *
 * The parameter is deliberately narrow rather than `unknown`. Accepting `unknown` and calling
 * `String()` on it would silently render `[object Object]` for a value that turned out not to be
 * text, which is a bug that looks like a styling problem; requiring the caller to have a scalar
 * makes the mistake a type error at the interpolation site instead.
 */
export function escapeHtml(value: string | number | null | undefined): string {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}
