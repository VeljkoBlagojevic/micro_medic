import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    MmButtonDirective,
    MmInputDirective,
    MmModalDirective,
    MmSelectDirective,
    type MmSelectOption,
} from '@micro-medic/design-system-angular';
import type { MedicineDto } from '@micro-medic/shared-types';
import { medicineLabel } from '../models/prescription.js';
import { firstErrorMessage, nonNegativeInteger, notBlank } from '../forms/validators.js';
import { MedicineSearchComponent } from './medicine-search.component.js';

/** What the dialog produces when confirmed. */
export interface PrescriptionSubmission {
    medicine: MedicineDto;
    methodUse: string;
    frequencyInHours: number;
}

/**
 * Dosing intervals, as `mm-select` options.
 *
 * A fixed list rather than a free number field: these are the intervals that actually get
 * prescribed, and a select cannot produce the typo that a number input can. "As needed" is `0`,
 * which the backend accepts — `MedicineUsage.frequencyIntakeInHours` is `@PositiveOrZero`, and
 * zero is the natural encoding for *pro re nata*.
 */
const FREQUENCY_OPTIONS: MmSelectOption[] = [
    { value: '0', label: 'As needed (PRN)' },
    { value: '4', label: 'Every 4 hours' },
    { value: '6', label: 'Every 6 hours (four times daily)' },
    { value: '8', label: 'Every 8 hours (three times daily)' },
    { value: '12', label: 'Every 12 hours (twice daily)' },
    { value: '24', label: 'Every 24 hours (once daily)' },
    { value: '48', label: 'Every 48 hours' },
    { value: '168', label: 'Weekly' },
];

/**
 * Adds one medicine to the therapy.
 *
 * A modal rather than an inline row, because adding a prescription is three decisions — which
 * medicine, how it is taken, how often — and inlining that would put a search field, a select and a
 * text input into the middle of the anamnesis. `mm-modal` brings the focus trap, the Escape and
 * backdrop dismissal and the focus restore with it, none of which is worth reimplementing here.
 *
 * The form is its own `FormGroup`, deliberately not part of the parent examination form. The
 * dialog's fields are only meaningful while it is open, and nesting them would mean the parent's
 * `valid` flipping to false whenever the dialog was opened and left incomplete — a dialog the
 * doctor cancels must leave no trace on the form behind it.
 */
@Component({
    selector: 'exam-prescription-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MmModalDirective,
        MmButtonDirective,
        MmInputDirective,
        MmSelectDirective,
        MedicineSearchComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <mm-modal
            [open]="open()"
            heading="Prescribe a medicine"
            size="lg"
            (close)="cancel()"
        >
            <div class="exam-rx-dialog">
                <exam-medicine-search
                    (medicineSelected)="onMedicineSelected($event)"
                ></exam-medicine-search>

                <!--
                  The dosing half stays hidden until a medicine is chosen: 'methodUse' and the
                  interval are instructions *about* a medicine, so offering them first invites the
                  doctor to fill in a form that has nothing to attach to.
                -->
                @if (medicine(); as chosen) {
                    <form class="exam-rx-dialog__form" [formGroup]="form" (ngSubmit)="confirm()">
                        <p class="exam-rx-dialog__chosen">
                            <span class="exam-rx-dialog__chosen-label mm-muted">Selected</span>
                            <strong>{{ label(chosen) }}</strong>
                            @if (chosen.form) {
                                <span class="mm-muted">· {{ chosen.form }}</span>
                            }
                        </p>

                        <mm-input
                            label="How it is taken"
                            formControlName="methodUse"
                            placeholder="e.g. one tablet after food"
                            required
                            [error]="methodUseError()"
                            hint="Written on the prescription exactly as entered."
                        ></mm-input>

                        <mm-select
                            label="How often"
                            formControlName="frequency"
                            [options]="frequencyOptions"
                            required
                            [error]="frequencyError()"
                        ></mm-select>

                        @if (duplicateWarning()) {
                            <p class="exam-rx-dialog__warning" role="alert">
                                {{ label(chosen) }} is already prescribed at that interval. Change
                                the interval, or close this dialog.
                            </p>
                        }
                    </form>
                }
            </div>

            <div slot="footer" class="exam-rx-dialog__actions">
                <mm-button variant="secondary" label="Cancel" (click)="cancel()"></mm-button>
                <mm-button
                    variant="primary"
                    label="Add to therapy"
                    [disabled]="!canConfirm()"
                    (click)="confirm()"
                ></mm-button>
            </div>
        </mm-modal>
    `,
})
export class PrescriptionDialogComponent {
    private readonly formBuilder = inject(FormBuilder);

    readonly open = input(false);

    /**
     * Set by the parent when the last confirm was rejected as a duplicate.
     *
     * The parent owns the prescription list, so it is the only thing that can *know*; the dialog
     * only reports. Passing the answer back down beats letting the dialog read the store, which
     * would give it a second reason to exist.
     */
    readonly duplicateWarning = input(false);

    readonly confirmed = output<PrescriptionSubmission>();
    readonly cancelled = output<void>();

    protected readonly frequencyOptions = FREQUENCY_OPTIONS;
    protected readonly medicine = signal<MedicineDto | null>(null);

    protected readonly form = this.formBuilder.nonNullable.group({
        methodUse: ['', [Validators.required, notBlank(), Validators.maxLength(255)]],
        // Pre-set to once daily, the most common interval — a required select with no default
        // makes the doctor confirm a choice the form could have made for them.
        // `nonNegativeInteger`, not a `>= 1` rule: `0` is the "as needed" option above, and the
        // entity's constraint is `@PositiveOrZero`. A stricter client rule could only refuse a
        // value the form itself offers.
        frequency: ['24', [Validators.required, nonNegativeInteger(24 * 30)]],
    });

    protected label = medicineLabel;

    /**
     * Plain methods rather than `computed()`, for the reason spelled out in
     * `ExaminationFormComponent`: a control's `errors`/`touched` are not signals, so a `computed`
     * would latch its first answer and never update.
     */
    protected readonly methodUseError = (): string | undefined =>
        firstErrorMessage(this.form.controls.methodUse, 'Instructions');

    protected readonly frequencyError = (): string | undefined =>
        firstErrorMessage(this.form.controls.frequency, 'Frequency');

    protected readonly canConfirm = (): boolean => this.medicine() !== null && this.form.valid;

    protected onMedicineSelected(medicine: MedicineDto): void {
        this.medicine.set(medicine);
    }

    protected confirm(): void {
        const chosen = this.medicine();
        if (!chosen) return;

        if (this.form.invalid) {
            // Without this the errors stay hidden — `firstErrorMessage` only speaks for a touched
            // or dirty control, so a submit attempt has to mark them itself.
            this.form.markAllAsTouched();
            return;
        }

        const { methodUse, frequency } = this.form.getRawValue();
        this.confirmed.emit({
            medicine: chosen,
            methodUse,
            frequencyInHours: Number(frequency),
        });
    }

    protected cancel(): void {
        this.cancelled.emit();
    }

    /**
     * Clears the dialog for its next use.
     *
     * Called by the parent after a successful add, rather than triggered by `open` flipping to
     * false: a reset on close would also wipe the form when the doctor dismissed the dialog by
     * accident, and reopening to find their typing gone is worse than reopening to find it intact.
     */
    reset(): void {
        this.medicine.set(null);
        this.form.reset({ methodUse: '', frequency: '24' });
    }
}
