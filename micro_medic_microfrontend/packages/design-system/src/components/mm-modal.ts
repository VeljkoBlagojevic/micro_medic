import { LitElement, css, html, nothing } from "lit";
import { baseStyles } from "../styles/shared.styles";

export class MmModal extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        heading: { type: String },
        size: { type: String },
        dissmissible: { type: Boolean },
    };

    open: boolean = false;
    heading: string = '';
    size: 'sm' | 'md' | 'lg' = 'md';
    dissmissible: boolean = true;

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
            }
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background-color: var(--mm-modal-bg-color, #fff);
                border-radius: var(--mm-modal-border-radius, 8px);
                box-shadow: var(--mm-modal-box-shadow, 0 2px 10px rgba(0, 0, 0, 0.1));
                width: var(--mm-modal-width, 500px);
                max-width: 90%;
                padding: var(--mm-modal-padding, 20px);
                position: relative;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--mm-modal-header-margin-bottom, 20px);
            }
            .modal-body {
                margin-bottom: var(--mm-modal-body-margin-bottom, 20px);
            }
            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: var(--mm-modal-footer-gap, 10px);
            }
            .close-button {
                background: none;
                border: none;
                font-size: var(--mm-modal-close-button-font-size, 24px);
                cursor: pointer;
            }
        `,
    ];

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('keydown', this._onKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('keydown', this._onKeyDown);
    }

    private _onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape' && this.dissmissible) {
            this.close();
        }
    }

    private close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('mm-close', { bubbles: true, composed: true }));
    }

    private onBackdrop(event: MouseEvent) {
        if (event.target === event.currentTarget && this.dissmissible) {
            this.close();
        }
    }

    render() {
        if (!this.open) {
            return html``;
        }
        return html`
            <div class="modal" @click="${this.onBackdrop}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${this.heading}</h2>
                        ${this.dissmissible ? html`<button class="close-button" @click="${this.close}">&times;</button>` : nothing}
                    </div>
                    <div class="modal-body">
                        <slot></slot>
                    </div>
                    <div class="modal-footer">
                        <slot name="footer"></slot>
                    </div>
                </div>
            </div>
        `;
    }
}

if (!customElements.get('mm-modal')) {
    customElements.define('mm-modal', MmModal);
}

declare global {
    interface HTMLElementTagNameMap {
        'mm-modal': MmModal;
    }
};
