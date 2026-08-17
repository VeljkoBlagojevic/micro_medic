import { LitElement, css, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { baseStyles } from '../styles/shared.styles';
import { defineElement } from '../define';
import './mm-toast';
import type { ToastType } from './mm-toast';

export interface ToastRecord {
    id: string;
    message: string;
    type: ToastType;
    /** Milliseconds until auto-dismissal, or `null`/`0` to stay until dismissed. */
    duration?: number | null;
}

/**
 * The stack of live notifications.
 *
 * Owns everything about *a set of* toasts — position, stacking order, the cap, and the
 * auto-dismiss timers — and nothing about where they came from. Its API is imperative
 * (`show`/`dismiss`/`clear`) rather than a `toasts` property, because a notification is an event,
 * not state: a consumer holding an array would have to remove entries itself when they expire, and
 * would fight this element over who owns the list.
 *
 * **Deliberately knows nothing about the event bus.** That belongs to the `notifications`
 * micro-frontend, which subscribes to `NOTIFICATION_SHOW` and calls `show()`. Keeping the split
 * here means the same element serves a consumer that wants toasts without the bus (a standalone
 * harness, or a future MFE with a local-only message), and it keeps this package free of any
 * dependency on `shared-store`.
 */
export class MmToastRegion extends LitElement {
    static properties = {
        placement: { type: String, reflect: true },
        max: { type: Number },
        _toasts: { state: true },
    };

    accessor placement: 'top-right' | 'top-center' | 'bottom-right' = 'top-right';

    /**
     * Most toasts shown at once; the oldest is dropped beyond it.
     *
     * A bound rather than a nicety: notifications arrive from every micro-frontend, and one in a
     * retry loop can emit indefinitely. Without a cap that remote covers the screen for every
     * other one.
     */
    accessor max = 4;

    private accessor _toasts: ToastRecord[] = [];

    /** Timers by toast id, so a manual dismissal can cancel the pending auto-dismissal. */
    private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

    private idCounter = 0;

    static styles = [
        baseStyles,
        css`
            :host {
                position: fixed;
                /*
                 * The shared z-index scale, which is the reason it exists. Independently deployed
                 * MFEs otherwise invent colliding values, and one team's toast lands behind
                 * another team's sticky header. --mm-z-index-toast is above --mm-z-index-modal on
                 * purpose: a notification about a failed save must be readable over the dialog that
                 * raised it.
                 */
                z-index: var(--mm-z-index-toast, 1100);
                display: flex;
                flex-direction: column;
                gap: var(--mm-space-2, 8px);
                width: min(380px, calc(100vw - var(--mm-space-8, 32px)));
                /*
                 * The container spans the toasts but must not swallow clicks on whatever is
                 * underneath it — it is fixed over the whole corner, most of which is empty. Each
                 * toast re-enables pointer events for itself.
                 */
                pointer-events: none;
            }
            :host mm-toast {
                pointer-events: auto;
            }

            :host([placement='top-right']) {
                top: var(--mm-space-4, 16px);
                right: var(--mm-space-4, 16px);
            }
            :host([placement='top-center']) {
                top: var(--mm-space-4, 16px);
                left: 50%;
                transform: translateX(-50%);
            }
            :host([placement='bottom-right']) {
                bottom: var(--mm-space-4, 16px);
                right: var(--mm-space-4, 16px);
                /* Newest nearest the edge the eye is already on. */
                flex-direction: column-reverse;
            }

            mm-toast {
                animation: toast-in var(--mm-transition-normal, 250ms)
                    var(--mm-transition-timing, ease-in-out);
            }
            @keyframes toast-in {
                from {
                    opacity: 0;
                    transform: translateY(-8px);
                }
            }
            /* The motion tokens are already zeroed under this query, but a keyframe ignores them. */
            @media (prefers-reduced-motion: reduce) {
                mm-toast {
                    animation: none;
                }
            }
        `,
    ];

    disconnectedCallback() {
        super.disconnectedCallback();
        // Timers outlive the DOM unless something cancels them: a route change that unmounts the
        // region would otherwise leave them firing against a detached element.
        this.clearTimers();
    }

    /**
     * Shows a notification and returns its id.
     *
     * A record with an id already on screen *replaces* it rather than stacking a duplicate: a
     * caller re-emitting the same id means "this is still true", not "here is another one".
     */
    show(record: Omit<ToastRecord, 'id'> & { id?: string }): string {
        const id = record.id ?? `mm-toast-${++this.idCounter}`;

        const toast: ToastRecord = { ...record, id };
        const existing = this._toasts.findIndex((t) => t.id === id);

        if (existing >= 0) {
            this.cancelTimer(id);
            const next = [...this._toasts];
            next[existing] = toast;
            this._toasts = next;
        } else {
            // Trim from the front: the oldest is the one the user has had longest to read.
            const kept = this._toasts.slice(Math.max(0, this._toasts.length - this.max + 1));
            for (const dropped of this._toasts.slice(0, this._toasts.length - kept.length)) {
                this.cancelTimer(dropped.id);
            }
            this._toasts = [...kept, toast];
        }

        const duration = record.duration;
        if (duration !== null && duration !== undefined && duration > 0) {
            this.timers.set(
                id,
                setTimeout(() => this.dismiss(id), duration)
            );
        }

        return id;
    }

    /** Removes a toast and emits `mm-toast-dismiss`. A no-op for an unknown id. */
    dismiss(id: string): void {
        if (!this._toasts.some((toast) => toast.id === id)) return;

        this.cancelTimer(id);
        this._toasts = this._toasts.filter((toast) => toast.id !== id);
        this.dispatchEvent(
            new CustomEvent<{ id: string }>('mm-toast-dismiss', {
                detail: { id },
                bubbles: true,
                composed: true,
            })
        );
    }

    /** Removes everything without emitting — for a logout, where the messages no longer apply. */
    clear(): void {
        this.clearTimers();
        this._toasts = [];
    }

    private cancelTimer(id: string): void {
        const timer = this.timers.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
    }

    private clearTimers(): void {
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers.clear();
    }

    render() {
        /*
         * `repeat` with the toast id as the key, not Lit's default index-based reuse. Keying by
         * index would re-use the DOM node of a dismissed toast for the one that shifted into its
         * place — so the enter animation would replay on a toast that has been sitting there, and
         * a message could visibly change type under the user.
         */
        return html`${repeat(
            this._toasts,
            (toast) => toast.id,
            (toast) => html`
                <mm-toast
                    type=${toast.type}
                    .message=${toast.message}
                    @mm-dismiss=${() => this.dismiss(toast.id)}
                ></mm-toast>
            `
        )}`;
    }
}

defineElement('mm-toast-region', MmToastRegion);

declare global {
    interface HTMLElementTagNameMap {
        'mm-toast-region': MmToastRegion;
    }
}
