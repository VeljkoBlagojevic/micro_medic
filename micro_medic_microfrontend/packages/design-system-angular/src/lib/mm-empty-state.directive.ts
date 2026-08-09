import { Directive, Input } from '@angular/core';
import type { MmEmptyState } from '@micro-medic/design-system';
import { MmElementDirective } from './custom-element.base';

/**
 * Typed bindings for `<mm-empty-state>`.
 *
 * Actions go in the default slot and a richer glyph in the `icon` slot — both are plain
 * projected content, so Angular templates use them as ordinary children:
 * `<mm-empty-state><mm-button label="Add"></mm-button></mm-empty-state>`.
 */
@Directive({
    selector: 'mm-empty-state',
    standalone: true,
})
export class MmEmptyStateDirective extends MmElementDirective<MmEmptyState> {
    @Input() heading?: string;
    @Input() description?: string;
    /** A literal glyph (e.g. '📋'), not an icon-font name. */
    @Input() icon?: string;
}
