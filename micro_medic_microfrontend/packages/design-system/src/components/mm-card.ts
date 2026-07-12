import { LitElement, html, css, render } from "lit";
import { baseStyles } from "../styles/shared.styles";

export class MmCard extends LitElement {
    static properties = {
        heading: { type: String },
        clickable: { type: Boolean, reflect: true },
        _hasFooter: { state: true },
    };

    heading: string = '';
    clickable: boolean = false;
    private _hasFooter: boolean = false;

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
                border: 1px solid var(--mm-border-color, #e0e0e0);
                border-radius: var(--mm-radius-md, 4px);
                background-color: var(--mm-card-bg-color, #fff);
                box-shadow: var(--mm-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
                transition: box-shadow var(--mm-transition-duration, 0.2s) var(--mm-transition-timing-function, ease-in-out);
            }
            :host([clickable]) {
                cursor: pointer;
                transition: box-shadow var(--mm-transition-duration, 0.2s) var(--mm-transition-timing-function, ease-in-out);
            }
            :host([clickable]:hover) {
                box-shadow: var(--mm-card-hover-box-shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
            }
            .card-header {
                padding: var(--mm-spacing-md, 16px);
                border-bottom: 1px solid var(--mm-border-color, #e0e0e0);
            }
            .card-body {
                padding: var(--mm-spacing-md, 16px);
            }
            .card-footer {
                padding: var(--mm-spacing-md, 16px);
                border-top: 1px solid var(--mm-border-color, #e0e0e0);
            }
        `,
    ];

    onClick(event: MouseEvent) {
        if (this.clickable) {
            this.dispatchEvent(new CustomEvent('card-click', { detail: { event } }));
        }
    }

    private onFooterSlotChange() {
        const footerSlot = this.shadowRoot?.querySelector('slot[name="footer"]') as HTMLSlotElement;
        this._hasFooter = footerSlot?.assignedNodes().length > 0;
    }

    render() {
        return html`
            <div class="card-header">
                <slot name="header">${this.heading}</slot>
            </div>
            <div class="card-body">
                <slot></slot>
            </div>
            ${this._hasFooter
                ? html`<div class="card-footer">
                      <slot name="footer" @slotchange=${this.onFooterSlotChange}></slot>
                    </div>`
                : ''}
        `;
    }
}

if (!customElements.get('mm-card')) {
    customElements.define('mm-card', MmCard);
}

declare global {
    interface HTMLElementTagNameMap {
        "mm-card": MmCard;
    }
}
