import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { baseStyles, focusRing } from '../styles/shared.styles';
import { defineElement } from '../define';

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let idCounter = 0;

export class MmModal extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        heading: { type: String },
        size: { type: String, reflect: true },
        dismissible: { type: Boolean },
        _hasFooter: { state: true },
    };

    open = false;
    heading = '';
    size: 'sm' | 'md' | 'lg' = 'md';
    dismissible = true;

    private _hasFooter = false;
    private readonly uid = `mm-modal-${++idCounter}`;
    /** Element that had focus before opening, so it can be restored on close. */
    private previouslyFocused: HTMLElement | null = null;

    static styles = [
        baseStyles,
        focusRing,
        css`
            :host {
                display: contents;
            }
            .backdrop {
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: var(--mm-space-4, 16px);
                background-color: var(--mm-color-overlay, rgba(0, 0, 0, 0.5));
                z-index: var(--mm-modal-z-index, 1000);
            }
            .dialog {
                display: flex;
                flex-direction: column;
                width: 100%;
                max-height: calc(100vh - var(--mm-space-8, 32px));
                background-color: var(--mm-color-surface, #fff);
                border-radius: var(--mm-radius-md, 8px);
                box-shadow: var(--mm-shadow-lg, 0 10px 20px rgba(0, 0, 0, 0.19));
            }
            /* Sizes were declared in the type but never applied — every modal was 500px. */
            :host([size='sm']) .dialog {
                max-width: 360px;
            }
            :host([size='md']) .dialog {
                max-width: 560px;
            }
            :host([size='lg']) .dialog {
                max-width: 860px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: var(--mm-space-4, 16px);
                padding: var(--mm-space-4, 16px);
                border-bottom: 1px solid var(--mm-color-border, #dee2e6);
            }
            .title {
                margin: 0;
                font-size: var(--mm-font-size-lg, 16px);
                font-weight: var(--mm-font-weight-bold, 600);
            }
            .body {
                flex: 1;
                padding: var(--mm-space-4, 16px);
                overflow-y: auto;
            }
            .footer {
                display: flex;
                justify-content: flex-end;
                gap: var(--mm-space-2, 8px);
                padding: var(--mm-space-4, 16px);
                border-top: 1px solid var(--mm-color-border, #dee2e6);
            }
            /* Collapse the footer when nothing is slotted into it, rather than leaving a bare border. */
            .footer[hidden] {
                display: none;
            }
            .close {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                padding: 0;
                font-size: 24px;
                line-height: 1;
                color: var(--mm-color-text-muted, #6c757d);
                background: none;
                border: none;
                border-radius: var(--mm-radius-sm, 4px);
                cursor: pointer;
            }
            .close:hover {
                background-color: var(--mm-color-neutral-200, #e9ecef);
                color: var(--mm-color-text, #212529);
            }
        `,
    ];

    connectedCallback() {
        super.connectedCallback();
        // Escape must be caught at the document level: the host is not focusable, so a
        // `keydown` listener on `this` only fires when focus is already inside the modal —
        // which it is not before the user tabs into it.
        document.addEventListener('keydown', this.onDocumentKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.onDocumentKeyDown);
        this.releaseScrollLock();
    }

    protected updated(changed: PropertyValues<this>) {
        if (!changed.has('open')) return;

        if (this.open) {
            this.previouslyFocused = (document.activeElement as HTMLElement) ?? null;
            document.body.style.overflow = 'hidden';
            // Wait for the dialog to render before moving focus into it.
            void this.updateComplete.then(() => this.focusFirstElement());
        } else {
            this.releaseScrollLock();
            this.previouslyFocused?.focus?.();
            this.previouslyFocused = null;
        }
    }

    private releaseScrollLock() {
        document.body.style.removeProperty('overflow');
    }

    /** Arrow property so `removeEventListener` gets the identical reference. */
    private onDocumentKeyDown = (event: KeyboardEvent) => {
        if (!this.open) return;
        if (event.key === 'Escape' && this.dismissible) {
            event.stopPropagation();
            this.close();
        } else if (event.key === 'Tab') {
            this.trapFocus(event);
        }
    };

    /**
     * Keeps Tab inside the dialog. Focusable candidates live both in this shadow root (the
     * close button) and in the slotted light DOM (form fields, footer buttons), so both are
     * collected.
     */
    private focusableElements(): HTMLElement[] {
        const dialog = this.renderRoot?.querySelector('.dialog');
        if (!dialog) return [];

        const shadowCandidates = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
        const slotted = Array.from(dialog.querySelectorAll('slot'))
            .flatMap((slot) => (slot as HTMLSlotElement).assignedElements())
            .flatMap((el) => [
                ...(el.matches(FOCUSABLE) ? [el as HTMLElement] : []),
                ...Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)),
            ]);

        return [...shadowCandidates, ...slotted].filter(
            (el) => el.offsetParent !== null || el === document.activeElement
        );
    }

    private focusFirstElement() {
        const [first] = this.focusableElements();
        (first ?? this.renderRoot?.querySelector<HTMLElement>('.dialog'))?.focus?.();
    }

    private trapFocus(event: KeyboardEvent) {
        const focusable = this.focusableElements();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        // `activeElement` is the host element when focus is inside a shadow root, so compare
        // against the deepest active element instead.
        const active = this.deepActiveElement();

        if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    private deepActiveElement(): Element | null {
        let active: Element | null = document.activeElement;
        while (active?.shadowRoot?.activeElement) {
            active = active.shadowRoot.activeElement;
        }
        return active;
    }

    private close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('mm-close', { bubbles: true, composed: true }));
    }

    private onFooterSlotChange(event: Event) {
        this._hasFooter = (event.target as HTMLSlotElement).assignedNodes().length > 0;
    }

    private onBackdrop(event: MouseEvent) {
        if (event.target === event.currentTarget && this.dismissible) {
            this.close();
        }
    }

    render() {
        if (!this.open) return nothing;

        return html`
            <div class="backdrop" @click=${this.onBackdrop}>
                <div
                    class="dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby=${this.heading ? `${this.uid}-title` : nothing}
                    tabindex="-1"
                >
                    <div class="header">
                        <h2 class="title" id="${this.uid}-title">${this.heading}</h2>
                        ${this.dismissible
                            ? html`<button
                                  class="close"
                                  type="button"
                                  aria-label="Close dialog"
                                  @click=${this.close}
                              >
                                  &times;
                              </button>`
                            : nothing}
                    </div>
                    <div class="body"><slot></slot></div>
                    <div class="footer" ?hidden=${!this._hasFooter}>
                        <slot name="footer" @slotchange=${this.onFooterSlotChange}></slot>
                    </div>
                </div>
            </div>
        `;
    }
}

defineElement('mm-modal', MmModal);

declare global {
    interface HTMLElementTagNameMap {
        'mm-modal': MmModal;
    }
}
