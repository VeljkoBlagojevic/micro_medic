import { LitElement, css, html, nothing } from 'lit';
import { baseStyles } from '../styles/shared.styles';
import { defineElement } from '../define';

export type MmTableRow = Record<string, unknown>;

export interface MmTableColumn<TRow extends MmTableRow = MmTableRow> {
    key: string;
    label: string;
    /** Renders the cell. Return `''` for "no value" — the default renderer already blanks nullish. */
    format?: (value: unknown, row: TRow) => string;
    align?: 'left' | 'center' | 'right';
    width?: string;
}

export class MmTable extends LitElement {
    static properties = {
        // Objects and arrays cannot round-trip through an attribute, so these are
        // property-only: React/Lit consumers must assign them, not set an attribute.
        columns: { attribute: false },
        rows: { attribute: false },
        clickable: { type: Boolean, reflect: true },
        rowKey: { type: String, attribute: 'row-key' },
        emptyStateMessage: { type: String, attribute: 'empty-state-message' },
        caption: { type: String },
    };

    columns: MmTableColumn[] = [];
    rows: MmTableRow[] = [];
    clickable = false;
    /** Column used as the stable row identity. Falls back to the row index. */
    rowKey = 'id';
    emptyStateMessage = 'No data available';
    caption = '';

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid var(--mm-color-border, #dee2e6);
            }
            caption {
                padding: var(--mm-space-2, 8px);
                font-weight: var(--mm-font-weight-bold, 600);
                text-align: left;
            }
            th,
            td {
                padding: var(--mm-space-2, 8px);
                border-bottom: 1px solid var(--mm-color-border, #dee2e6);
                text-align: left;
            }
            th {
                background-color: var(--mm-color-neutral-100, #f8f9fa);
                font-weight: var(--mm-font-weight-bold, 600);
            }
            /* Scoped to tbody: a bare tr:hover would also highlight the header row. */
            tbody tr:hover {
                background-color: var(--mm-color-neutral-100, #f8f9fa);
            }
            :host([clickable]) tbody tr {
                cursor: pointer;
            }
            :host([clickable]) tbody tr:focus-visible {
                outline: 2px solid var(--mm-color-accent, #3498db);
                outline-offset: -2px;
            }
            .align-center {
                text-align: center;
            }
            .align-right {
                text-align: right;
            }
            .empty-state {
                padding: var(--mm-space-8, 32px);
                text-align: center;
                color: var(--mm-color-text-muted, #6c757d);
            }
        `,
    ];

    /**
     * `String(value)` turned a missing field into the literal text "undefined" or "null" in
     * the cell. Nullish values render as an empty cell instead.
     */
    private cellValue(column: MmTableColumn, row: MmTableRow): string {
        const value = row[column.key];
        if (column.format) return column.format(value, row);
        return value === null || value === undefined ? '' : String(value);
    }

    private onRowClick(row: MmTableRow) {
        if (!this.clickable) return;
        // `composed: true` — without it the event stops at the shadow boundary and no
        // consumer outside the component can ever hear it.
        this.dispatchEvent(
            new CustomEvent('mm-row-click', { detail: { row }, bubbles: true, composed: true })
        );
    }

    private onRowKeyDown(event: KeyboardEvent, row: MmTableRow) {
        if (!this.clickable) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.onRowClick(row);
        }
    }

    private rowIdentity(row: MmTableRow, index: number): string | number {
        const key = row[this.rowKey];
        return typeof key === 'string' || typeof key === 'number' ? key : index;
    }

    render() {
        if (this.rows.length === 0) {
            return html`<div class="empty-state">${this.emptyStateMessage}</div>`;
        }

        return html`
            <table>
                ${this.caption ? html`<caption>${this.caption}</caption>` : nothing}
                <thead>
                    <tr>
                        ${this.columns.map(
                            (column) => html`
                                <th
                                    scope="col"
                                    class=${column.align ? `align-${column.align}` : nothing}
                                    style=${column.width ? `width:${column.width}` : nothing}
                                >
                                    ${column.label}
                                </th>
                            `
                        )}
                    </tr>
                </thead>
                <tbody>
                    ${this.rows.map(
                        (row, index) => html`
                            <tr
                                data-row-key=${this.rowIdentity(row, index)}
                                tabindex=${this.clickable ? 0 : nothing}
                                @click=${() => this.onRowClick(row)}
                                @keydown=${(event: KeyboardEvent) => this.onRowKeyDown(event, row)}
                            >
                                ${this.columns.map(
                                    (column) => html`
                                        <td class=${column.align ? `align-${column.align}` : nothing}>
                                            ${this.cellValue(column, row)}
                                        </td>
                                    `
                                )}
                            </tr>
                        `
                    )}
                </tbody>
            </table>
        `;
    }
}

defineElement('mm-table', MmTable);

declare global {
    interface HTMLElementTagNameMap {
        'mm-table': MmTable;
    }
}
