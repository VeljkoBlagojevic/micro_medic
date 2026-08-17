import { LitElement, css, html, nothing } from 'lit';
import { baseStyles, focusRing } from '../styles/shared.styles';
import { defineElement } from '../define';

let idCounter = 0;

export class MmInput extends LitElement {
    static properties = {
        label: { type: String },
        name: { type: String },
        type: { type: String },
        value: { type: String },
        placeholder: { type: String },
        error: { type: String },
        hint: { type: String },
        disabled: { type: Boolean, reflect: true },
        readonly: { type: Boolean, reflect: true },
        required: { type: Boolean, reflect: true },
        multiline: { type: Boolean },
        rows: { type: Number },
        autocomplete: { type: String },
        min: { type: String },
        max: { type: String },
        step: { type: String },
    };

    accessor label = '';
    accessor name = '';
    accessor type = 'text';
    accessor value = '';
    accessor placeholder = '';
    accessor error = '';
    accessor hint = '';
    accessor disabled = false;
    accessor readonly = false;
    accessor required = false;
    accessor multiline = false;
    accessor rows = 3;
    accessor autocomplete = '';
    accessor min = '';
    accessor max = '';
    accessor step = '';

    /**
     * Ids must be unique *within this shadow root*, but `aria-describedby` and `for` are
     * resolved inside the same root, so a per-instance suffix is only needed to keep dev
     * tools readable. Generated once per element rather than per render.
     */
    private readonly uid = `mm-input-${++idCounter}`;

    static styles = [
        baseStyles,
        focusRing,
        css`
            :host {
                display: block;
            }
            label {
                display: block;
                margin-bottom: var(--mm-space-1, 4px);
                font-size: var(--mm-font-size-sm, 12px);
                font-weight: var(--mm-font-weight-medium, 500);
                color: var(--mm-color-text, #212529);
            }
            .required-marker {
                color: var(--mm-color-danger, #dc3545);
                margin-left: 2px;
            }
            input,
            textarea {
                width: 100%;
                padding: var(--mm-space-2, 8px);
                color: inherit;
                background-color: var(--mm-color-surface, #fff);
                border: 1px solid var(--mm-color-border, #dee2e6);
                border-radius: var(--mm-radius-sm, 4px);
                font-family: inherit;
                font-size: var(--mm-font-size-base, 14px);
                transition: border-color var(--mm-transition-fast, 150ms)
                        var(--mm-transition-timing, ease-in-out),
                    box-shadow var(--mm-transition-fast, 150ms) var(--mm-transition-timing, ease-in-out);
            }
            textarea {
                resize: vertical;
            }
            input:focus,
            textarea:focus {
                border-color: var(--mm-color-accent, #3498db);
                box-shadow: 0 0 0 3px var(--mm-color-focus-ring, rgba(52, 152, 219, 0.45));
                outline: none;
            }
            input:disabled,
            textarea:disabled,
            input:read-only,
            textarea:read-only {
                background-color: var(--mm-color-disabled-bg, #e9ecef);
                cursor: not-allowed;
            }
            /* aria-invalid drives the error styling, so the two can never disagree. */
            input[aria-invalid='true'],
            textarea[aria-invalid='true'] {
                border-color: var(--mm-color-danger, #dc3545);
            }
            input[aria-invalid='true']:focus,
            textarea[aria-invalid='true']:focus {
                box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.3);
            }
            .error,
            .hint {
                margin-top: var(--mm-space-1, 4px);
                font-size: var(--mm-font-size-sm, 12px);
            }
            .error {
                color: var(--mm-color-danger, #dc3545);
            }
            .hint {
                color: var(--mm-color-text-muted, #6c757d);
            }
        `,
    ];

    /** Focus delegation: `inputEl.focus()` so calling `.focus()` on the host works. */
    focus(options?: FocusOptions) {
        this.control?.focus(options);
    }

    /** Native validation state of the inner control, for callers that need it. */
    checkValidity(): boolean {
        return this.control?.checkValidity() ?? true;
    }

    private get control(): HTMLInputElement | HTMLTextAreaElement | null {
        return this.renderRoot?.querySelector('input, textarea') ?? null;
    }

    private onInput(evt: Event) {
        this.value = (evt.target as HTMLInputElement | HTMLTextAreaElement).value;
        this.emit('mm-input');
    }

    private onChange(evt: Event) {
        this.value = (evt.target as HTMLInputElement | HTMLTextAreaElement).value;
        this.emit('mm-change');
    }

    /**
     * `blur` does not cross a shadow boundary on its own (it does not bubble), so React
     * consumers listening on the host would never see it. Re-emit it as a composed event
     * that does — form libraries rely on blur to mark a field as touched.
     */
    private onBlur() {
        this.emit('mm-blur');
    }

    private emit(type: 'mm-input' | 'mm-change' | 'mm-blur') {
        this.dispatchEvent(
            new CustomEvent(type, {
                detail: { value: this.value, name: this.name },
                bubbles: true,
                composed: true,
            })
        );
    }

    private renderControl() {
        const describedBy =
            [this.error ? `${this.uid}-error` : '', this.hint ? `${this.uid}-hint` : '']
                .filter(Boolean)
                .join(' ') || undefined;
        const invalid = this.error ? 'true' : 'false';

        // `.value` (property, not attribute) keeps the DOM in sync when the value is reset
        // programmatically; an attribute binding would only set the *initial* value.
        if (this.multiline) {
            return html`
                <textarea
                    id=${this.uid}
                    name=${this.name}
                    .value=${this.value}
                    rows=${this.rows}
                    placeholder=${this.placeholder}
                    ?disabled=${this.disabled}
                    ?readonly=${this.readonly}
                    ?required=${this.required}
                    aria-invalid=${invalid}
                    aria-describedby=${describedBy ?? nothing}
                    @input=${this.onInput}
                    @change=${this.onChange}
                    @blur=${this.onBlur}
                ></textarea>
            `;
        }
        return html`
            <input
                id=${this.uid}
                type=${this.type}
                name=${this.name}
                .value=${this.value}
                placeholder=${this.placeholder}
                autocomplete=${this.autocomplete || nothing}
                min=${this.min || nothing}
                max=${this.max || nothing}
                step=${this.step || nothing}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                ?required=${this.required}
                aria-invalid=${invalid}
                aria-describedby=${describedBy ?? nothing}
                @input=${this.onInput}
                @change=${this.onChange}
                @blur=${this.onBlur}
            />
        `;
    }

    render() {
        return html`
            ${this.label
                ? html`<label for=${this.uid}>
                      ${this.label}${this.required
                          ? html`<span class="required-marker" aria-hidden="true">*</span>`
                          : nothing}
                  </label>`
                : nothing}
            ${this.renderControl()}
            ${this.error
                ? html`<div id="${this.uid}-error" class="error" role="alert">${this.error}</div>`
                : nothing}
            ${this.hint && !this.error
                ? html`<div id="${this.uid}-hint" class="hint">${this.hint}</div>`
                : nothing}
        `;
    }
}

defineElement('mm-input', MmInput);

declare global {
    interface HTMLElementTagNameMap {
        'mm-input': MmInput;
    }
}
