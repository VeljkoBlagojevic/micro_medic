import { LitElement, html, css } from "lit";
import { baseStyles } from "../styles/shared.styles";

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

export class MmButton extends LitElement {
    static properties = {
        variant: { type: String },
        size: { type: String },
        disabled: { type: Boolean },
        loading: { type: Boolean },
        type: { type: String },
        fullWidth: { type: Boolean, reflect: true },
    }

    variant: ButtonVariant = 'primary';
    size: ButtonSize = 'md';
    disabled: boolean = false;
    loading: boolean = false
    type: 'button' | 'submit' | 'reset' = 'button';
    fullWidth: boolean = false;

    static styles = [
        baseStyles,
        css`
            :host {
                display: inline-block;
            }
            :host([fullWidth]) {
                width: 100%;
            }
            button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: var(--mm-space-2, 0.5rem);
                padding: var(--mm-space-2, 0.5rem) var(--mm-space-4, 1rem);
                font-size: var(--mm-font-size, 12px);
                font-weight: var(--mm-font-weight, 500);
                font-family: inherit;
                cursor: pointer;
                line-height: 1;
                transition: all var(--mm-transition-duration, 0.2s) var(--mm-transition-timing-function, ease-in-out);
                border: none;
                border-radius: var(--mm-radius-md, 4px);
            }
            button:disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }
            .size-sm {
                padding: var(--mm-space-1, 0.25rem) var(--mm-space-2, 0.5rem);
                font-size: var(--mm-font-size-sm, 10px);
            }
            .size-md {
                padding: var(--mm-space-2, 0.5rem) var(--mm-space-4, 1rem);
                font-size: var(--mm-font-size, 12px);
            }
            .size-lg {
                padding: var(--mm-space-3, 0.75rem) var(--mm-space-6, 1.5rem);
                font-size: var(--mm-font-size-lg, 14px);
            }
            .variant-primary {
                background-color: var(--mm-color-primary, #007bff);
                color: var(--mm-color-on-primary, #fff);
            }
            .variant-secondary {
                background-color: var(--mm-color-secondary, #6c757d);
                color: var(--mm-color-on-secondary, #fff);
            }
            .variant-primary:hover:not(:disabled),
            .variant-secondary:hover:not(:disabled) {
                filter: brightness(0.9);
                opacity: 0.8;
            }
            .variant-danger {
                background-color: var(--mm-color-danger, #dc3545);
                color: var(--mm-color-on-danger, #fff);
            }
            .variant-success {
                background-color: var(--mm-color-success, #28a745);
                color: var(--mm-color-on-success, #fff);
            }
            .variant-warning {
                background-color: var(--mm-color-warning, #ffc107);
                color: var(--mm-color-on-warning, #212529);
            }
            .spinner {
                width: 1em;
                height: 1em;
                border: 2px solid var(--mm-color-on-primary, #fff);
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `
    ];

    private onClick(event: Event) {
        if (this.disabled || this.loading) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }

    render() {
        return html`
            <button
                class="variant-${this.variant} size-${this.size}"
                ?disabled=${this.disabled || this.loading}
                type=${this.type}
                @click=${this.onClick}
            >
                ${this.loading ? html`<span class="spinner"></span>` : html`<slot></slot>`}
            </button>
        `;
    }
}

if (!customElements.get('mm-button')) {
    customElements.define('mm-button', MmButton);
}

declare global {
    interface HTMLElementTagNameMap {
        'mm-button': MmButton;
    }
}