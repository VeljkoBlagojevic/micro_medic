import { LitElement, css, html } from "lit";
import { baseStyles } from "../styles/shared.styles";

export class MmInput extends LitElement {
    static properties = {
        label: { type: String },
        name: { type: String },
        type: { type: String },
        value: { type: String },
        placeholder: { type: String },
        error: { type: String },
        disabled: { type: Boolean },
        required: { type: Boolean },
        multiline: { type: Boolean },
        rows: { type: Number },
    };

    label: string = '';
    name: string = '';
    type: string = 'text';
    value: string = '';
    placeholder: string = '';
    error: string = '';
    disabled: boolean = false;
    required: boolean = false;
    multiline: boolean = false;
    rows: number = 3;

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
                font-family: var(--mm-font-family, Arial, sans-serif);
            }
            label {
                display: block;
                margin-bottom: var(--mm-spacing-sm, 8px);
                font-weight: var(--mm-font-weight-bold, 600);
            }
            input,
            textarea {
                width: 100%;
                padding: var(--mm-spacing-sm, 8px);
                border: 1px solid var(--mm-color-border, #ccc);
                border-radius: var(--mm-border-radius, 4px);
                font-family: var(--mm-font-family, Arial, sans-serif);
                font-size: var(--mm-font-size-base, 16px);
            }
            input:disabled,
            textarea:disabled {
                background-color: var(--mm-color-disabled-bg, #f5f5f5);
                cursor: not-allowed;
            }
            .error {
                color: var(--mm-color-error, #dc3545);
                font-size: var(--mm-font-size-sm, 12px);
                margin-top: var(--mm-spacing-xs, 4px);
            }
        `,
    ];

    private onInput(evt: Event) {
        const target = evt.target as HTMLInputElement | HTMLTextAreaElement;
        this.value = target.value;
        this.dispatchEvent(new CustomEvent('mm-input', { detail: { value: this.value }, bubbles: true, composed: true }));
    }

    private onChange(evt: Event) {
        const target = evt.target as HTMLInputElement | HTMLTextAreaElement;
        this.value = target.value;
        this.dispatchEvent(new CustomEvent('mm-change', { detail: { value: this.value }, bubbles: true, composed: true }));
    }

    private renderControl() {
        if (this.multiline) {
            return html`
                <textarea
                    name="${this.name}"
                    .value="${this.value}"
                    ?disabled="${this.disabled}"
                    ?required="${this.required}"
                    rows="${this.rows}"
                    placeholder="${this.placeholder}"
                    @input="${this.onInput}"
                    @change="${this.onChange}"
                >
                </textarea>
            `;
        } else {
            return html`
                <input
                    type="${this.type}"
                    name="${this.name}"
                    .value="${this.value}"
                    ?disabled="${this.disabled}"
                    ?required="${this.required}"
                    placeholder="${this.placeholder}"
                    @input="${this.onInput}"
                    @change="${this.onChange}"
                />
            `;
        }
    }

    render() {
        return html`
            ${this.label ? html`<label for="${this.name}">${this.label}</label>` : ''}
            ${this.renderControl()}
            ${this.error ? html`<div class="error">${this.error}</div>` : ''}
        `;
    }
}

if (!customElements.get('mm-input')) {
    customElements.define('mm-input', MmInput);
}

declare global {
    interface HTMLElementTagNameMap {
        'mm-input': MmInput;
    }
};