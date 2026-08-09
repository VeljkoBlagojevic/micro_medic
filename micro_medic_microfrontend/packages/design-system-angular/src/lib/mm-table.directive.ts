import { Directive, EventEmitter, Input, Output } from '@angular/core';
import type { MmTable, MmTableColumn, MmTableRow } from '@micro-medic/design-system';
import { booleanInput } from './coercion';
import { MmElementDirective } from './custom-element.base';

/** `mm-row-click` payload. Generic so a consumer can name its own row type. */
export type MmRowClickEvent<TRow extends MmTableRow = MmTableRow> = CustomEvent<{ row: TRow }>;

/**
 * Typed bindings for `<mm-table>`.
 *
 * This is the component that most needs the wrapper. `columns` and `rows` are declared
 * `attribute: false` on the element because objects cannot round-trip through an attribute, so
 * they *must* be assigned as properties — which is exactly what the base directive does.
 */
@Directive({
    selector: 'mm-table',
    standalone: true,
    host: {
        '(mm-row-click)': 'forward(rowClick, $event)',
    },
})
export class MmTableDirective<TRow extends MmTableRow = MmTableRow> extends MmElementDirective<MmTable> {
    @Input() columns?: MmTableColumn<TRow>[];
    @Input() rows?: TRow[];
    @Input() caption?: string;
    @Input() rowKey?: string;
    @Input() emptyStateMessage?: string;
    @Input({ transform: booleanInput }) clickable?: boolean;

    @Output() readonly rowClick = new EventEmitter<MmRowClickEvent<TRow>>();
}
