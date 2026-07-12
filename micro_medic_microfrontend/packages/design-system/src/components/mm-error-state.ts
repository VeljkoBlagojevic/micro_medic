import { LitElement, css, html } from "lit";
import { baseStyles } from "../styles/shared.styles";

export class MmErrorState extends LitElement {
    static properties = {
        heading: { type: String },
        description: { type: String },
        retryable: { type: Boolean, },
    };

    heading: string = 'An error occurred';
    description: string = 'Something went wrong. Please try again later.'
    retryable: boolean = false;

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
                text-align: center;
                padding: var(--mm-spacing-lg, 32px);
                color: var(--mm-error-state-color, #dc3545);
            }
            .heading {
                font-size: var(--mm-error-state-heading-font-size, 24px);
                font-weight: var(--mm-error-state-heading-font-weight, 600);
                margin-bottom: var(--mm-spacing-sm, 8px);
            }
            .description {
                font-size: var(--mm-error-state-description-font-size, 16px);
                color: var(--mm-error-state-description-color, #dc3545);
            }
        `,
    ];

    render() {
        return html`
            <div class="heading">${this.heading}</div>
            <div class="description">${this.description}</div>
        `;
    }
}

if (!customElements.get('mm-error-state')) {
    customElements.define('mm-error-state', MmErrorState);
}

declare global {
    interface HTMLElementTagNameMap {
        'mm-error-state': MmErrorState;
    }
}
