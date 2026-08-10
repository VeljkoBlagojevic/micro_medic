import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    inject,
    output,
    signal,
} from '@angular/core';
import {
    MmButtonDirective,
    MmEmptyStateDirective,
    MmInputDirective,
    MmSpinnerDirective,
    type MmInputEvent,
} from '@micro-medic/design-system-angular';
import type { MedicineDto } from '@micro-medic/shared-types';
import { medicineLabel } from '../models/prescription.js';
import { medicineService } from '../services/medicine.service.js';
import { createAsyncListState } from '../state/async-state.js';
import { loadErrorMessage } from '../utils/error-message.js';

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 8;

/**
 * Debounced search over the medicine catalogue.
 *
 * Structurally the twin of what `icd10` does for diseases, and for the same reason: both are large
 * seeded reference datasets (`medicines.json`, `icd10_codes.json` at ~8.6 MB) that must be searched
 * server-side. `GET /api/medicines/**` is cached server-side with no TTL, so repeated searches are
 * cheap — but the debounce still matters, because without it every keystroke is a request whose
 * response may arrive out of order.
 *
 * Two independent guards against showing the wrong results, which is worth being explicit about
 * since only one of them is obvious:
 *   - the **debounce** below coalesces keystrokes into one request per pause;
 *   - the **sequence number** inside `createAsyncState` discards a superseded response, which the
 *     debounce alone cannot do — two requests that both survive the debounce can still land in the
 *     wrong order.
 */
@Component({
    selector: 'exam-medicine-search',
    standalone: true,
    imports: [
        MmInputDirective,
        MmButtonDirective,
        MmSpinnerDirective,
        MmEmptyStateDirective,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="exam-medsearch">
            <!--
              `[value]` is bound but no form directive is attached, which is the documented way to
              use `mm-input` outside a form: `MmInputDirective` implements `ControlValueAccessor`,
              so combining the two would give the value two owners.
            -->
            <mm-input
                label="Find a medicine"
                type="search"
                placeholder="Generic or brand name…"
                [value]="query()"
                hint="Searches the seeded medicine catalogue."
                (valueInput)="onQueryInput($event)"
            ></mm-input>

            @if (results.isInitialLoading()) {
                <mm-spinner size="sm" label="Searching…"></mm-spinner>
            } @else if (results.error(); as message) {
                <p class="exam-medsearch__error" role="status">{{ message }}</p>
            } @else if (results.isEmpty()) {
                <mm-empty-state
                    heading="No medicines found"
                    [description]="'Nothing matched “' + query() + '”.'"
                ></mm-empty-state>
            } @else if (results.data(); as medicines) {
                <ul class="exam-medsearch__list">
                    @for (medicine of medicines; track medicine.id) {
                        <li class="exam-medsearch__item">
                            <button
                                class="exam-medsearch__option"
                                type="button"
                                [attr.aria-current]="medicine.id === selectedId() ? 'true' : null"
                                (click)="select(medicine)"
                            >
                                <span class="exam-medsearch__name">{{ label(medicine) }}</span>
                                @if (medicine.form) {
                                    <span class="exam-medsearch__form mm-muted">{{ medicine.form }}</span>
                                }
                            </button>
                        </li>
                    }
                </ul>
                @if (results.isLoading()) {
                    <!-- Refreshing with results already on screen: a quiet note, not a spinner
                         replacing the list the doctor is reading. -->
                    <p class="exam-medsearch__refreshing mm-muted" role="status">Updating…</p>
                }
            } @else {
                <p class="exam-medsearch__prompt mm-muted">
                    Type at least {{ MIN_QUERY }} characters to search, or
                    <mm-button
                        variant="tertiary"
                        size="sm"
                        label="browse all"
                        (click)="browseAll()"
                    ></mm-button>
                </p>
            }
        </div>
    `,
})
export class MedicineSearchComponent {
    /** Emits the chosen medicine. The parent decides what to do with it. */
    readonly medicineSelected = output<MedicineDto>();

    protected readonly MIN_QUERY = 2;

    protected readonly query = signal('');
    protected readonly selectedId = signal<number | null>(null);
    protected readonly results = createAsyncListState<MedicineDto>();

    private debounceHandle: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        // A pending timer must not fire into a destroyed component. `DestroyRef` is the Angular
        // counterpart of the `debounced.cancel()` teardown `icd10` registers by hand.
        inject(DestroyRef).onDestroy(() => this.cancelPending());
    }

    protected label = medicineLabel;

    protected onQueryInput(event: MmInputEvent): void {
        const value = event.detail.value;
        this.query.set(value);
        this.cancelPending();

        const trimmed = value.trim();
        if (trimmed.length < this.MIN_QUERY) {
            // Below the threshold, clear rather than search: a one-character query matches most of
            // the catalogue, so the results would be noise the doctor has to scroll past.
            this.results.reset();
            return;
        }

        this.debounceHandle = setTimeout(() => void this.runSearch(trimmed), DEBOUNCE_MS);
    }

    protected async browseAll(): Promise<void> {
        this.cancelPending();
        this.query.set('');
        await this.results.run(
            async () => (await medicineService.list({ page: 0, size: PAGE_SIZE })).content,
            (error) => loadErrorMessage(error, 'the medicine catalogue')
        );
    }

    protected select(medicine: MedicineDto): void {
        this.selectedId.set(medicine.id);
        this.medicineSelected.emit(medicine);
    }

    private async runSearch(query: string): Promise<void> {
        await this.results.run(
            async () => (await medicineService.search(query, { page: 0, size: PAGE_SIZE })).content,
            (error) => loadErrorMessage(error, 'the medicine catalogue')
        );
    }

    private cancelPending(): void {
        if (this.debounceHandle !== null) {
            clearTimeout(this.debounceHandle);
            this.debounceHandle = null;
        }
    }
}
