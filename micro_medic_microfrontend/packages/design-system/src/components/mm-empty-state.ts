import { LitElement, css, html, nothing } from 'lit';
import { baseStyles } from '../styles/shared.styles';
import { defineElement } from '../define';

export class MmEmptyState extends LitElement {
    static properties = {
        heading: { type: String },
        description: { type: String },
        icon: { type: String },
    };

    accessor heading = 'Nothing here yet';
    accessor description = 'There is no content to display at the moment.';
    /**
     * A literal glyph, not an icon-font name. The previous default was `'info-circle'`
     * rendered into an `<sl-icon>` — a Shoelace element this design system never registers,
     * so it produced an empty inline box. Slot `icon` for anything richer.
     */
    accessor icon = '📋';

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
                padding: var(--mm-space-8, 32px) var(--mm-space-4, 16px);
                text-align: center;
                color: var(--mm-color-text-muted, #6c757d);
            }
            .icon {
                font-size: var(--mm-font-size-icon, 40px);
                line-height: 1;
                margin-bottom: var(--mm-space-3, 12px);
            }
            .heading {
                font-size: var(--mm-font-size-lg, 16px);
                font-weight: var(--mm-font-weight-bold, 600);
                color: var(--mm-color-text, #212529);
                margin-bottom: var(--mm-space-1, 4px);
            }
            .description {
                font-size: var(--mm-font-size-base, 14px);
            }
            .actions {
                margin-top: var(--mm-space-4, 16px);
            }
            [hidden] {
                display: none;
            }
        `,
    ];

    render() {
        return html`
            <div class="icon" aria-hidden="true"><slot name="icon">${this.icon}</slot></div>
            ${this.heading ? html`<div class="heading">${this.heading}</div>` : nothing}
            ${this.description ? html`<div class="description">${this.description}</div>` : nothing}
            <div class="actions"><slot></slot></div>
        `;
    }
}

defineElement('mm-empty-state', MmEmptyState);

declare global {
    interface HTMLElementTagNameMap {
        'mm-empty-state': MmEmptyState;
    }
}
