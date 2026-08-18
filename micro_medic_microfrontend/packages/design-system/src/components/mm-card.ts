import { LitElement, html, css } from 'lit';
import { baseStyles } from '../styles/shared.styles';
import { defineElement } from '../define';

export class MmCard extends LitElement {
    static properties = {
        heading: { type: String },
        clickable: { type: Boolean, reflect: true },
        _hasHeader: { state: true },
        _hasFooter: { state: true },
    };

    accessor heading = '';
    accessor clickable = false;

    private accessor _hasHeader = false;
    private accessor _hasFooter = false;

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
                background-color: var(--mm-color-surface, #fff);
                border: 1px solid var(--mm-color-border, #dee2e6);
                border-radius: var(--mm-radius-md, 8px);
                box-shadow: var(--mm-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.12));
                transition: box-shadow var(--mm-transition-normal, 250ms)
                    var(--mm-transition-timing, ease-in-out);
            }
            :host([clickable]) {
                cursor: pointer;
            }
            :host([clickable]:hover) {
                box-shadow: var(--mm-shadow-md, 0 3px 6px rgba(0, 0, 0, 0.16));
            }
            :host([clickable]:focus-visible) {
                outline: 2px solid var(--mm-color-accent, #3498db);
                outline-offset: 2px;
            }
            .header,
            .footer,
            .body {
                padding: var(--mm-space-4, 16px);
            }
            .header {
                border-bottom: 1px solid var(--mm-color-border, #dee2e6);
                font-weight: var(--mm-font-weight-bold, 600);
            }
            .footer {
                border-top: 1px solid var(--mm-color-border, #dee2e6);
            }
            [hidden] {
                display: none;
            }
        `,
    ];

    /**
     * A clickable card must be reachable by keyboard. Setting these here (rather than in the
     * template) keeps them on the host, where assistive technology looks for them.
     */
    protected willUpdate() {
        if (this.clickable) {
            if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
            if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
        } else {
            if (this.getAttribute('tabindex') === '0') this.removeAttribute('tabindex');
            if (this.getAttribute('role') === 'button') this.removeAttribute('role');
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('click', this.handleClick);
        this.addEventListener('keydown', this.handleKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('click', this.handleClick);
        this.removeEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Namespaced as `mm-card-click` to match every other component's event naming; the old
     * `card-click` was the only unprefixed event in the design system.
     */
    private handleClick = () => {
        if (!this.clickable) return;
        this.dispatchEvent(new CustomEvent('mm-card-click', { bubbles: true, composed: true }));
    };

    private handleKeyDown = (event: KeyboardEvent) => {
        if (!this.clickable) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleClick();
        }
    };

    private handleHeaderSlotChange(event: Event) {
        this._hasHeader = (event.target as HTMLSlotElement).assignedNodes().length > 0;
    }

    private handleFooterSlotChange(event: Event) {
        this._hasFooter = (event.target as HTMLSlotElement).assignedNodes().length > 0;
    }

    render() {
        const showHeader = this._hasHeader || !!this.heading;
        return html`
            <div class="header" ?hidden=${!showHeader}>
                <slot name="header" @slotchange=${this.handleHeaderSlotChange}>${this.heading}</slot>
            </div>
            <div class="body"><slot></slot></div>
            <!--
              The footer slot is always rendered but hidden when empty. Rendering it
              conditionally on \`_hasFooter\` was a deadlock: \`slotchange\` can only fire once
              the slot exists, so a footer was never displayed.
            -->
            <div class="footer" ?hidden=${!this._hasFooter}>
                <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
            </div>
        `;
    }
}

defineElement('mm-card', MmCard);

declare global {
    interface HTMLElementTagNameMap {
        'mm-card': MmCard;
    }
}
