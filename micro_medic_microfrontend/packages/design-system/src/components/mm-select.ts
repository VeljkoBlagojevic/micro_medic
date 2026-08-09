import { LitElement, css, html, nothing } from 'lit';
import { baseStyles, focusRing } from '../styles/shared.styles';
import { defineElement } from '../define';

let idCounter = 0;

export interface MmSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

/**
 * Single-choice select.
 *
 * Deliberately a wrapper around a native `<select>` rather than a custom listbox: the native
 * control brings keyboard navigation, type-ahead, and the platform's own mobile picker for
 * free, and no hand-rolled popup gets all of that right. It also cannot be clipped by an
 * ancestor's `overflow`, which is the usual reason a custom dropdown breaks inside a modal.
 *
 * `options` is a property, not a slot, for the same reason `mm-table` takes `rows`: an array of
 * objects cannot be expressed as an attribute, and slotting `<option>` elements would leave
 * them in the light DOM where the native select cannot see them.
 *
 * The label/error/hint markup, ids, `aria-describedby` wiring and the `mm-input`/`mm-change`/
 * `mm-blur` event trio mirror `mm-input` exactly, so the same form bridge (`MmField`,
 * `MmInputDirective`) works against either element without a special case.
 */
export class MmSelect extends LitElement {
    static properties = {
        label: { type: String },
        name: { type: String },
        value: { type: String },
        /** Shown as a disabled first entry while `value` is empty. */
        placeholder: { type: String },
        options: { type: Array },
        error: { type: String },
        hint: { type: String },
        disabled: { type: Boolean, reflect: true },
        required: { type: Boolean, reflect: true },
    };

    label = '';
    name = '';
    value = '';
    placeholder = '';
    options: MmSelectOption[] = [];
    error = '';
    hint = '';
    disabled = false;
    required = false;

    private readonly uid = `mm-select-${++idCounter}`;

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
            select {
                width: 100%;
                padding: var(--mm-space-2, 8px);
                color: inherit;
                background-color: var(--mm-color-surface, #fff);
                border: 1px solid var(--mm-color-border, #dee2e6);
                border-radius: var(--mm-radius-sm, 4px);
                font-family: inherit;
                font-size: var(--mm-font-size-base, 14px);
                /* Matches mm-input's height: a native select is one line shorter otherwise. */
                line-height: var(--mm-line-height, 1.5);
                transition: border-color var(--mm-transition-fast, 150ms)
                        var(--mm-transition-timing, ease-in-out),
                    box-shadow var(--mm-transition-fast, 150ms) var(--mm-transition-timing, ease-in-out);
            }
            select:focus {
                border-color: var(--mm-color-accent, #3498db);
                box-shadow: 0 0 0 3px var(--mm-color-focus-ring, rgba(52, 152, 219, 0.45));
                outline: none;
            }
            select:disabled {
                background-color: var(--mm-color-disabled-bg, #e9ecef);
                cursor: not-allowed;
            }
            select[aria-invalid='true'] {
                border-color: var(--mm-color-danger, #dc3545);
            }
            select[aria-invalid='true']:focus {
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

    focus(options?: FocusOptions) {
        this.control?.focus(options);
    }

    checkValidity(): boolean {
        return this.control?.checkValidity() ?? true;
    }

    private get control(): HTMLSelectElement | null {
        return this.renderRoot?.querySelector('select') ?? null;
    }

    /**
     * A native select has no `input`-then-`change` distinction worth exposing, but form
     * bridges listen for `mm-input` (that is where `MmField` maps `onValueChange`), so both
     * are emitted from the one native `change`.
     */
    private onChange(evt: Event) {
        this.value = (evt.target as HTMLSelectElement).value;
        this.emit('mm-input');
        this.emit('mm-change');
    }

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

    render() {
        const describedBy =
            [this.error ? `${this.uid}-error` : '', this.hint ? `${this.uid}-hint` : '']
                .filter(Boolean)
                .join(' ') || undefined;

        return html`
            ${this.label
                ? html`<label for=${this.uid}>
                      ${this.label}${this.required
                          ? html`<span class="required-marker" aria-hidden="true">*</span>`
                          : nothing}
                  </label>`
                : nothing}
            <select
                id=${this.uid}
                name=${this.name}
                .value=${this.value}
                ?disabled=${this.disabled}
                ?required=${this.required}
                aria-invalid=${this.error ? 'true' : 'false'}
                aria-describedby=${describedBy ?? nothing}
                @change=${this.onChange}
                @blur=${this.onBlur}
            >
                ${this.placeholder
                    ? html`<option value="" disabled ?selected=${!this.value}>
                          ${this.placeholder}
                      </option>`
                    : nothing}
                ${this.options.map(
                    (option) => html`
                        <option
                            value=${option.value}
                            ?disabled=${option.disabled ?? false}
                            ?selected=${option.value === this.value}
                        >
                            ${option.label}
                        </option>
                    `
                )}
            </select>
            ${this.error
                ? html`<div id="${this.uid}-error" class="error" role="alert">${this.error}</div>`
                : nothing}
            ${this.hint && !this.error
                ? html`<div id="${this.uid}-hint" class="hint">${this.hint}</div>`
                : nothing}
        `;
    }
}

defineElement('mm-select', MmSelect);

declare global {
    interface HTMLElementTagNameMap {
        'mm-select': MmSelect;
    }
}
