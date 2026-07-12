import { LitElement, css, html } from "lit";
import { baseStyles } from "../styles/shared.styles";

export interface MmTableColumn {
    key: string;
    label: string;
    format?: (value: any, rowData: Record<string, unknown>) => string;
    align?: 'left' | 'center' | 'right';
}

export class MmTable extends LitElement {
    static properties = {
        columns: { attribute: false, type: Array },
        rows: { attribute: false, type: Array },
        clickable: { type: Boolean, reflect: true },
        emptyStateMessage: { type: String, attribute: 'empty-state-message' },
    };

    columns: MmTableColumn[] = [];
    rows: Record<string, unknown>[] = [];
    clickable: boolean = false;
    emptyStateMessage: string = 'No data available';

    static styles = [
        baseStyles,
        css`
            :host {
                display: block;
                font-family: var(--mm-font-family, Arial, sans-serif);
            }
            table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid var(--mm-table-border-color, #ccc);
            }
            th, td {
                padding: var(--mm-table-cell-padding, 8px);
                text-align: left;
                border-bottom: 1px solid var(--mm-table-border-color, #ccc);
            }
            th {
                background-color: var(--mm-table-header-background-color, #f5f5f5);
                font-weight: bold;
            }
            tr:hover {
                background-color: var(--mm-table-row-hover-background-color, #f1f1f1);
            }
            :host([clickable]) tr {
                cursor: pointer;
            }
            .empty-state {
                text-align: center;
                padding: var(--mm-spacing-lg, 32px);
                color: var(--mm-empty-state-color, #666);
            }
        `,
    ];

    private cellValue(column: MmTableColumn, rowData: Record<string, unknown>): string {
        const value = rowData[column.key];
        if (column.format) {
            return column.format(value, rowData);
        }
        return String(value);
    }

    private onRowClick(rowData: Record<string, unknown>) {
        if (this.clickable) {
            this.dispatchEvent(new CustomEvent('mm-row-click', { detail: { rowData } }));
        }
    }

    render() {
        if (this.rows.length === 0) {
            return html`<div class="empty-state">${this.emptyStateMessage}</div>`;
        }
        return html`
            <table>
                <thead>
                    <tr>
                        ${this.columns.map(column => html`<th>${column.label}</th>`)}
                    </tr>
                </thead>
                <tbody>
                    ${this.rows.map(rowData => html`
                        <tr @click="${() => this.onRowClick(rowData)}">
                            ${this.columns.map(column => html`<td>${this.cellValue(column, rowData)}</td>`)}
                        </tr>
                    `)}
                </tbody>
            </table>
        `;
    }
}

if (!customElements.get('mm-table')) {
    customElements.define('mm-table', MmTable);
}

declare global {
    interface HTMLElementTagNameMap {
        'mm-table': MmTable;
    }
};