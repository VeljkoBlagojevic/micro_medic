import { LitElement, css, html, nothing } from 'lit';
import { baseStyles } from '../styles/shared.styles';
import { defineElement } from '../define';

export class MmErrorState extends LitElement {
    static properties = {
        heading: { type: String },
        description: { type: String },
        /** Alias for `description`, because `Calendar.tsx` passed `message=`. */
        message: { type: String },
        retryable: { type: Boolean },
        retryLabel: { type: String, attribute: 'retry-label' },
    };

    accessor heading = 'An error occurred';
    accessor description = 'Something went wrong. Please try again later.';
    accessor message = '';
    accessor retryable = false;
    accessor retryLabel = 'Try again';

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
                padding: var(--mm-space-8, 32px) var(--mm-space-4, 16px);
                text-align: center;
            }
            .icon {
                font-size: var(--mm-font-size-icon, 40px);
                line-height: 1;
                margin-bottom: var(--mm-space-3, 12px);
            }
            .heading {
                font-size: var(--mm-font-size-lg, 16px);
                font-weight: var(--mm-font-weight-bold, 600);
                color: var(--mm-color-danger, #dc3545);
                margin-bottom: var(--mm-space-1, 4px);
            }
            .description {
                font-size: var(--mm-font-size-base, 14px);
                color: var(--mm-color-text-muted, #6c757d);
            }
            .retry {
                margin-top: var(--mm-space-4, 16px);
                padding: var(--mm-space-2, 8px) var(--mm-space-4, 16px);
                font: inherit;
                color: var(--mm-color-on-primary, #fff);
                background-color: var(--mm-color-primary, #0f3460);
                border: none;
                border-radius: var(--mm-radius-sm, 4px);
                cursor: pointer;
            }
            .retry:hover {
                filter: brightness(0.92);
            }
            .retry:focus-visible {
                outline: 2px solid var(--mm-color-accent, #3498db);
                outline-offset: 2px;
            }
        `,
    ];

    private handleRetry() {
        this.dispatchEvent(new CustomEvent('mm-retry', { bubbles: true, composed: true }));
    }

    render() {
        // `role="alert"` so the failure is announced rather than silently swapped in.
        return html`
            <div role="alert">
                <div class="icon" aria-hidden="true">⚠️</div>
                ${this.heading ? html`<div class="heading">${this.heading}</div>` : nothing}
                <div class="description">${this.message || this.description}</div>
                ${this.retryable
                    ? html`<button class="retry" type="button" @click=${this.handleRetry}>
                          ${this.retryLabel}
                      </button>`
                    : nothing}
            </div>
        `;
    }
}

defineElement('mm-error-state', MmErrorState);

declare global {
    interface HTMLElementTagNameMap {
        'mm-error-state': MmErrorState;
    }
}
