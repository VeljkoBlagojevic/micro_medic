import { LitElement, css, html } from "lit";
import { baseStyles } from "../styles/shared.styles";

export class MmSpinner extends LitElement {
    static properties = {
        size: { type: String },
        label: { type: String },
        centered: { type: Boolean },
    };

    size: 'sm' | 'md' | 'lg' = 'md';
    label: string = 'Loading...';
    centered: boolean = false;

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
            }
            .spinner {
                display: inline-block;
                width: var(--mm-spinner-size, 40px);
                height: var(--mm-spinner-size, 40px);
                border: 4px solid var(--mm-spinner-color, #f3f3f3);
                border-top: 4px solid var(--mm-spinner-color-active, #3498db);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            .spinner.sm {
                width: var(--mm-spinner-size-sm, 20px);
                height: var(--mm-spinner-size-sm, 20px);
                border-width: 2px;
            }
            .spinner.md {
                width: var(--mm-spinner-size-md, 40px);
                height: var(--mm-spinner-size-md, 40px);
                border-width: 4px;
            }
            .spinner.lg {
                width: var(--mm-spinner-size-lg, 60px);
                height: var(--mm-spinner-size-lg, 60px);
                border-width: 6px;
            }
            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
            .label {
                display: block;
                margin-top: var(--mm-spacing-sm, 8px);
                font-size: var(--mm-font-size-md, 16px);
                color: var(--mm-spinner-label-color, #333);
            }
            .centered {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
            }
        `,
    ];

    render() {
        return html`
            <div class="${this.centered ? 'centered' : ''}">
                <div class="spinner ${this.size}"></div>
                <span class="label">${this.label}</span>
            </div>
        `;
    }
}

if (!customElements.get('mm-spinner')) {
    customElements.define('mm-spinner', MmSpinner);
}

declare global {
    interface HTMLElementTagNameMap {
        'mm-spinner': MmSpinner;
    }
};

