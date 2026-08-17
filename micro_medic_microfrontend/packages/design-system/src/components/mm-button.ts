import { LitElement, html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { baseStyles, focusRing } from '../styles/shared.styles';
import { defineElement } from '../define';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

export class MmButton extends LitElement {
    static properties = {
        variant: { type: String, reflect: true },
        size: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        loading: { type: Boolean, reflect: true },
        type: { type: String },
        fullWidth: { type: Boolean, reflect: true, attribute: 'full-width' },
        label: { type: String },
    };

    accessor variant: ButtonVariant = 'primary';
    accessor size: ButtonSize = 'md';
    accessor disabled = false;
    accessor loading = false;
    accessor type: ButtonType = 'button';
    accessor fullWidth = false;
    /** Accessible name used while `loading` replaces the slotted label with a spinner. */
    accessor label = '';

    static styles = [
        baseStyles,
        focusRing,
        css`
            :host {
                display: inline-block;
            }
            /*
             * Attribute selectors must match the lowercased attribute name: a [fullWidth]
             * selector never matches, because HTML attributes are case-insensitive and Lit
             * reflects the property as full-width.
             */
            :host([full-width]) {
                display: block;
                width: 100%;
            }
            :host([full-width]) button {
                width: 100%;
            }
            button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: var(--mm-space-2, 8px);
                font-family: inherit;
                font-weight: var(--mm-font-weight-medium, 500);
                line-height: 1;
                cursor: pointer;
                border: 1px solid transparent;
                border-radius: var(--mm-radius-sm, 4px);
                transition: background-color var(--mm-transition-fast, 150ms)
                        var(--mm-transition-timing, ease-in-out),
                    box-shadow var(--mm-transition-fast, 150ms) var(--mm-transition-timing, ease-in-out),
                    opacity var(--mm-transition-fast, 150ms) var(--mm-transition-timing, ease-in-out);
            }
            button:disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }
            button:not(:disabled):hover {
                filter: brightness(0.92);
            }
            button:not(:disabled):active {
                filter: brightness(0.85);
            }

            .size-sm {
                padding: var(--mm-space-1, 4px) var(--mm-space-2, 8px);
                font-size: var(--mm-font-size-sm, 12px);
            }
            .size-md {
                padding: var(--mm-space-2, 8px) var(--mm-space-4, 16px);
                font-size: var(--mm-font-size-base, 14px);
            }
            .size-lg {
                padding: var(--mm-space-3, 12px) var(--mm-space-6, 24px);
                font-size: var(--mm-font-size-lg, 16px);
            }

            .variant-primary {
                background-color: var(--mm-color-primary, #0f3460);
                color: var(--mm-color-on-primary, #fff);
            }
            .variant-secondary {
                background-color: var(--mm-color-secondary, #6c757d);
                color: var(--mm-color-on-secondary, #fff);
            }
            /* Every ButtonVariant needs a rule here, or it renders unstyled. */
            .variant-tertiary {
                background-color: transparent;
                color: var(--mm-color-primary, #0f3460);
                border-color: var(--mm-color-border, #dee2e6);
            }
            .variant-danger {
                background-color: var(--mm-color-danger, #dc3545);
                color: var(--mm-color-on-danger, #fff);
            }
            .variant-success {
                background-color: var(--mm-color-success, #2ecc71);
                color: var(--mm-color-on-success, #fff);
            }
            .variant-warning {
                background-color: var(--mm-color-warning, #f39c12);
                color: var(--mm-color-on-warning, #212529);
            }

            .spinner {
                width: 1em;
                height: 1em;
                border: 2px solid currentColor;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 0.7s linear infinite;
            }
            @media (prefers-reduced-motion: reduce) {
                .spinner {
                    animation-duration: 2s;
                }
            }
            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `,
    ];

    /**
     * A shadow-DOM `<button type="submit">` cannot submit a light-DOM `<form>` — the form
     * association does not cross the shadow boundary. Re-dispatch the intent on the host so
     * the surrounding form still submits.
     */
    private onClick(event: Event) {
        if (this.disabled || this.loading) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        if (this.type === 'submit' || this.type === 'reset') {
            const form = this.closest('form');
            if (form) {
                event.preventDefault();
                if (this.type === 'submit') {
                    form.requestSubmit();
                } else {
                    form.reset();
                }
            }
        }
    }

    render() {
        const busy = this.disabled || this.loading;
        return html`
            <button
                class="variant-${this.variant} size-${this.size}"
                type=${this.type}
                ?disabled=${busy}
                aria-busy=${this.loading ? 'true' : 'false'}
                aria-label=${ifDefined(this.loading && this.label ? this.label : undefined)}
                @click=${this.onClick}
            >
                ${this.loading
                    ? html`<span class="spinner" part="spinner"></span>`
                    : html`<slot></slot>`}
            </button>
        `;
    }
}

defineElement('mm-button', MmButton);

declare global {
    interface HTMLElementTagNameMap {
        'mm-button': MmButton;
    }
}
