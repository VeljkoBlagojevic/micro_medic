import { LitElement, css, html } from 'lit';
import { baseStyles, focusRing } from '../styles/shared.styles';
import { defineElement } from '../define';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * A single notification.
 *
 * Purely presentational: it renders a message and a dismiss control, and it announces itself. It
 * owns no timer, no id and no stacking — those are the *region*'s concern (`mm-toast-region`), and
 * keeping them out of here is what lets a toast be rendered on its own, inline, by a consumer that
 * wants one without the machinery.
 */
export class MmToast extends LitElement {
    static properties = {
        type: { type: String, reflect: true },
        message: { type: String },
        dismissible: { type: Boolean },
    };

    accessor type: ToastType = 'info';
    /** The text to show. Slot the default slot instead for anything richer. */
    accessor message = '';
    accessor dismissible = true;

    static styles = [
        baseStyles,
        focusRing,
        css`
            :host {
                display: flex;
                align-items: flex-start;
                gap: var(--mm-space-3, 12px);
                padding: var(--mm-space-3, 12px) var(--mm-space-4, 16px);
                border: 1px solid;
                border-radius: var(--mm-radius-md, 8px);
                box-shadow: var(--mm-shadow-md, 0 3px 6px rgba(0, 0, 0, 0.16));
            }

            /*
             * The *-surface token trio, not --mm-color-success and friends.
             *
             * A toast is a block of colour behind a paragraph of text, so it needs the desaturated
             * surface variant; the saturated --mm-color-success is tuned to sit behind
             * --mm-color-on-success on a button-sized area and is far too loud for this. Every type
             * needs all three rules or it renders with no border and inherited text colour.
             */
            :host([type='success']) {
                background-color: var(--mm-color-success-surface, #d1e7dd);
                border-color: var(--mm-color-success-border, #a3cfbb);
                color: var(--mm-color-on-success-surface, #0a3622);
            }
            :host([type='error']) {
                background-color: var(--mm-color-danger-surface, #f8d7da);
                border-color: var(--mm-color-danger-border, #f1aeb5);
                color: var(--mm-color-on-danger-surface, #58151c);
            }
            :host([type='warning']) {
                background-color: var(--mm-color-warning-surface, #fff3cd);
                border-color: var(--mm-color-warning-border, #ffe69c);
                color: var(--mm-color-on-warning-surface, #664d03);
            }
            :host([type='info']) {
                background-color: var(--mm-color-info-surface, #cff4fc);
                border-color: var(--mm-color-info-border, #9eeaf9);
                color: var(--mm-color-on-info-surface, #055160);
            }

            .message {
                flex: 1;
                /* A long API error body must wrap rather than widen the toast past the region. */
                min-width: 0;
                overflow-wrap: anywhere;
            }

            .dismiss {
                flex: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                padding: 0;
                font-size: var(--mm-font-size-xl, 20px);
                line-height: 1;
                /* currentColor, so the control stays legible on all four surfaces. */
                color: currentColor;
                background: none;
                border: none;
                border-radius: var(--mm-radius-sm, 4px);
                cursor: pointer;
                opacity: 0.7;
            }
            .dismiss:hover {
                opacity: 1;
            }
        `,
    ];

    private handleDismiss() {
        /*
         * `composed: true` so the event escapes the shadow root — without it a consumer listening
         * on the host (or the region, which delegates) never sees it. `bubbles` alone is not
         * enough for a shadow-DOM event.
         */
        this.dispatchEvent(new CustomEvent('mm-dismiss', { bubbles: true, composed: true }));
    }

    render() {
        /*
         * `alert` for the failures, `status` for the rest — the distinction is the reason a shared
         * toast is worth building once. `alert` interrupts a screen reader immediately, which is
         * right for "Could not save" and actively hostile for "Appointment booked": announcing
         * every success mid-sentence turns an accessible feature into an unusable one.
         *
         * The role is on the inner wrapper rather than the host so a consumer cannot silently
         * override it with an attribute, and it is set on every render because it is derived from
         * `type`.
         */
        const assertive = this.type === 'error' || this.type === 'warning';

        return html`
            <div class="message" role=${assertive ? 'alert' : 'status'}>
                ${this.message}<slot></slot>
            </div>
            ${this.dismissible
                ? html`<button
                      class="dismiss"
                      type="button"
                      aria-label="Dismiss notification"
                      @click=${this.handleDismiss}
                  >
                      &times;
                  </button>`
                : ''}
        `;
    }
}

defineElement('mm-toast', MmToast);

declare global {
    interface HTMLElementTagNameMap {
        'mm-toast': MmToast;
    }
}
