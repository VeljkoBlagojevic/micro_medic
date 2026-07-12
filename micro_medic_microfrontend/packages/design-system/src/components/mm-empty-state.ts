import { LitElement, css, html } from "lit";
import { baseStyles } from "../styles/shared.styles";

export class MmEmptyState extends LitElement {
    static properties = {
        heading: { type: String },
        description: { type: String },
        icon: { type: String },
    };

    heading: string = 'Nothing here yet';
    description: string = 'There is no content to display at the moment.'
    icon: string = 'info-circle';

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
                text-align: center;
                padding: var(--mm-spacing-lg, 32px);
                color: var(--mm-empty-state-color, #6c757d);
            }
            .icon {
                font-size: var(--mm-empty-state-icon-size, 48px);
                margin-bottom: var(--mm-spacing-md, 16px);
            }
            .heading {
                font-size: var(--mm-empty-state-heading-font-size, 24px);
                font-weight: var(--mm-empty-state-heading-font-weight, 600);
                margin-bottom: var(--mm-spacing-sm, 8px);
            }
            .description {
                font-size: var(--mm-empty-state-description-font-size, 16px);
                color: var(--mm-empty-state-description-color, #6c757d);
            }
        `,
    ];

    render() {
        return html`
            <div class="icon">
                <sl-icon name="${this.icon}"></sl-icon>
            </div>
            <div class="heading">${this.heading}</div>
            <div class="description">${this.description}</div>
        `;
    }
}

if (!customElements.get('mm-empty-state')) {
    customElements.define('mm-empty-state', MmEmptyState);
}

declare global {
    interface HTMLElementTagNameMap {
        'mm-empty-state': MmEmptyState;
    }
}