import { LitElement, css, html, nothing } from 'lit';
import { baseStyles } from '../styles/shared.styles';
import { defineElement } from '../define';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export class MmSpinner extends LitElement {
    static properties = {
        size: { type: String, reflect: true },
        label: { type: String },
        centered: { type: Boolean, reflect: true },
        hideLabel: { type: Boolean, attribute: 'hide-label' },
    };

    size: SpinnerSize = 'md';
    label = 'Loading...';
    centered = false;
    /** Keeps the label as the accessible name but removes it visually. */
    hideLabel = false;

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
            }
            .wrapper {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                gap: var(--mm-space-2, 8px);
            }
            :host([centered]) {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100%;
            }
            .spinner {
                border-style: solid;
                border-color: var(--mm-color-neutral-200, #e9ecef);
                border-top-color: var(--mm-color-accent, #3498db);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            /*
             * Sizes are driven by the reflected host attribute. Previously a `.spinner` base
             * rule and a `.spinner.sm` rule both set width/height at equal specificity, so
             * the outcome depended on declaration order rather than the `size` property.
             */
            :host([size='sm']) .spinner {
                width: 16px;
                height: 16px;
                border-width: 2px;
            }
            :host([size='md']) .spinner {
                width: 32px;
                height: 32px;
                border-width: 3px;
            }
            :host([size='lg']) .spinner {
                width: 56px;
                height: 56px;
                border-width: 5px;
            }
            .label {
                font-size: var(--mm-font-size-sm, 12px);
                color: var(--mm-color-text-muted, #6c757d);
            }
            @media (prefers-reduced-motion: reduce) {
                .spinner {
                    animation-duration: 2.5s;
                }
            }
            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
            .mm-sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `,
    ];

    render() {
        return html`
            <div class="wrapper" role="status" aria-live="polite" aria-label=${this.label}>
                <div class="spinner" part="spinner"></div>
                ${this.hideLabel
                    ? html`<span class="mm-sr-only">${this.label}</span>`
                    : this.label
                      ? html`<span class="label">${this.label}</span>`
                      : nothing}
            </div>
        `;
    }
}

defineElement('mm-spinner', MmSpinner);

declare global {
    interface HTMLElementTagNameMap {
        'mm-spinner': MmSpinner;
    }
}
