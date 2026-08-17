import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    signal,
    viewChild,
} from '@angular/core';
import {
    MmButtonDirective,
    MmEmptyStateDirective,
    MmTableDirective,
    type MmRowClickEvent,
    type MmTableColumn,
} from '@micro-medic/design-system-angular';
import { formatFrequency, medicineLabel } from '../models/prescription.js';
import { ExaminationDraftStore } from '../state/examination-draft.store.js';
import { EventBusService } from '../state/event-bus.service.js';
import {
    PrescriptionDialogComponent,
    type PrescriptionSubmission,
} from './prescription-dialog.component.js';

/**
 * Flat, pre-formatted row — `mm-table` renders strings, not objects.
 *
 * A `type` alias, not an `interface`, for the same reason as `AppointmentRow`: `MmTableRow` is
 * `Record<string, unknown>` and an interface has no implicit index signature to satisfy it.
 */
type PrescriptionRow = {
    draftId: string;
    medicine: string;
    method: string;
    frequency: string;
};

/**
 * The therapy's medicine list.
 *
 * Maps to `Therapy → MedicineUsage → Medicine` in the backend's object graph, and closes a real gap:
 * the previous implementation hardcoded `medicineUsages: []`, so that whole branch — and
 * `MedicineUsageRequest` with it — was unreachable from any UI.
 *
 * Prescriptions are optional. `ExaminationRequest.medicineUsages` has no `@NotEmpty`, and an
 * examination that concludes no medication is needed is a legitimate clinical outcome, so the empty
 * state here says exactly that rather than nagging.
 */
@Component({
    selector: 'exam-prescription-list',
    standalone: true,
    imports: [
        MmTableDirective,
        MmButtonDirective,
        MmEmptyStateDirective,
        PrescriptionDialogComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <section class="exam-rx" aria-labelledby="exam-rx-heading">
            <header class="exam-rx__header">
                <h4 class="exam-rx__heading" id="exam-rx-heading">
                    Prescribed medicines
                    @if (rows().length > 0) {
                        <span class="exam-rx__count mm-muted">({{ rows().length }})</span>
                    }
                </h4>
                @if (!readonly()) {
                    <mm-button
                        variant="secondary"
                        size="sm"
                        label="Add medicine"
                        (click)="openDialog()"
                    ></mm-button>
                }
            </header>

            @if (rows().length === 0) {
                <mm-empty-state
                    heading="No medicines prescribed"
                    description="Optional — an examination can conclude that no medication is needed."
                ></mm-empty-state>
            } @else {
                <mm-table
                    [columns]="columns"
                    [rows]="rows()"
                    caption="Medicines prescribed in this examination"
                    rowKey="draftId"
                    [clickable]="!readonly()"
                    (rowClick)="onRowClick($event)"
                ></mm-table>
                @if (!readonly()) {
                    <p class="exam-rx__hint mm-muted">Select a row to remove it.</p>
                }
            }

            @if (!readonly()) {
                <exam-prescription-dialog
                    #dialog
                    [open]="dialogOpen()"
                    [duplicateWarning]="duplicateRejected()"
                    (confirmed)="onConfirmed($event)"
                    (cancelled)="closeDialog()"
                ></exam-prescription-dialog>
            }
        </section>
    `,
})
export class PrescriptionListComponent {
    private readonly draft = inject(ExaminationDraftStore);
    private readonly bus = inject(EventBusService);

    /**
     * Drops the "Add medicine" button, the dialog and row-click removal, leaving the table as a
     * record. Bound to `ExaminationDraftStore.isLocked()` — nothing in this component is a form
     * control, so the parent's `form.disable()` does not reach it.
     */
    readonly readonly = input(false);

    protected readonly dialogOpen = signal(false);
    protected readonly duplicateRejected = signal(false);

    /**
     * The dialog clears itself only when told to, which is this component's call to make: a reset
     * driven by `open` flipping to false would also wipe the fields when the doctor dismissed the
     * dialog by accident. `viewChild` is a signal, and undefined while `readonly()` keeps the
     * dialog out of the template — hence the optional call below.
     */
    private readonly dialog = viewChild<PrescriptionDialogComponent>('dialog');

    /**
     * No "remove" column: removal is the row click, and in readonly mode `[clickable]` simply goes
     * false. After the examination is recorded the list is a record of what was prescribed, and a
     * disabled control that cannot do anything is worse than no control at all.
     */
    protected readonly columns: MmTableColumn<PrescriptionRow>[] = [
        { key: 'medicine', label: 'Medicine' },
        { key: 'method', label: 'Instructions' },
        { key: 'frequency', label: 'Frequency', width: '10rem' },
    ];

    protected readonly rows = computed<PrescriptionRow[]>(() =>
        this.draft.prescriptions().map((prescription) => ({
            draftId: prescription.draftId,
            medicine: medicineLabel(prescription.medicine),
            method: prescription.methodUse,
            frequency: formatFrequency(prescription.frequencyInHours),
        }))
    );

    protected openDialog(): void {
        this.duplicateRejected.set(false);
        this.dialogOpen.set(true);
    }

    protected closeDialog(): void {
        this.dialogOpen.set(false);
        this.duplicateRejected.set(false);
    }

    protected onConfirmed(submission: PrescriptionSubmission): void {
        const added = this.draft.addPrescription(
            submission.medicine,
            submission.methodUse,
            submission.frequencyInHours
        );

        if (!added) {
            // The store rejected it as a duplicate. Keep the dialog open and say so — closing it
            // silently would look like the medicine had been added.
            this.duplicateRejected.set(true);
            return;
        }

        this.closeDialog();
        // Cleared only now, after the add succeeded — reopening the dialog should offer an empty
        // form, but a cancelled dialog must keep whatever was typed into it.
        this.dialog()?.reset();
        this.bus.notify('success', `${medicineLabel(submission.medicine)} added to the therapy.`);
    }

    protected onRowClick(event: MmRowClickEvent<PrescriptionRow>): void {
        if (this.readonly()) return;
        this.draft.removePrescription(event.detail.row.draftId);
    }
}
