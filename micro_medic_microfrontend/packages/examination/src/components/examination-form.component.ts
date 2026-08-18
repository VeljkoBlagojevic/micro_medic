import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    MmButtonDirective,
    MmInputDirective,
} from '@micro-medic/design-system-angular';
import { examinationService } from '../services/examination.service.js';
import {
    firstErrorMessage,
    minTrimmedLength,
    notBefore,
    notBlank,
    notInFuture,
} from '../forms/validators.js';
import { ExaminationDraftStore } from '../state/examination-draft.store.js';
import { EventBusService } from '../state/event-bus.service.js';
import { toDateTimeLocalInput } from '../utils/date-time.js';
import { examineErrorMessage } from '../utils/error-message.js';
import { DiagnosisPanelComponent } from './diagnosis-panel.component.js';
import { PrescriptionListComponent } from './prescription-list.component.js';

/**
 * Client clock tolerance for `@PastOrPresent` on `ExaminationRequest.startTime`.
 *
 * The backend compares the submitted instant against *its* clock, so a start time of "now" from a
 * client running slightly ahead would be rejected as future. The validator allows this much skew and
 * `toSubmittableStartTime` clamps the value on the way out, so the server never sees a future
 * instant and a correctly filled form is never refused.
 */
const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

/** A start time before this is a mistyped year, not a real consultation. */
const EARLIEST_PLAUSIBLE_START = new Date('2000-01-01T00:00:00');

const ANAMNESIS_MIN_LENGTH = 10;
const THERAPY_MIN_LENGTH = 5;

const FIELD_LABELS = {
    startTime: 'Start time',
    anamnesis: 'Anamnesis',
    therapyDescription: 'Therapy instructions',
} as const;

/**
 * The examination form — the commit point of this micro-frontend.
 *
 * Two of the four values it submits are *not* form fields. The diagnosis arrives from `icd10` over
 * the event bus and the appointment from the calendar, so both live in `ExaminationDraftStore`;
 * the anamnesis, start time and therapy instructions live here, in the reactive form that already
 * owns their validation state. `canSubmit` is where the two halves meet — and they are kept separate
 * so that a blocked submit can say *which* piece is missing rather than reddening everything.
 *
 * Every validator mirrors a backend constraint (`@NotBlank`, `@PastOrPresent`). None of it is
 * enforcement: `@Valid` on `ExaminationRequest` re-checks all of it, `@PreAuthorize` re-checks the
 * role, and `AccessGuard` re-checks the row-level ownership on every request. What client validation
 * buys is that the doctor learns about a blank field before losing a round trip, not that the rule
 * is applied.
 */
@Component({
    selector: 'exam-examination-form',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MmInputDirective,
        MmButtonDirective,
        DiagnosisPanelComponent,
        PrescriptionListComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <form class="exam-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="exam-form__row">
                <mm-input
                    label="Examination started"
                    type="datetime-local"
                    formControlName="startTime"
                    required
                    [error]="startTimeError()"
                    hint="Defaults to now. Cannot be in the future."
                ></mm-input>
            </div>

            <mm-input
                label="Anamnesis"
                formControlName="anamnesis"
                multiline
                [rows]="6"
                required
                placeholder="What the patient reports — symptoms, onset, history…"
                [error]="anamnesisError()"
                hint="Stored as the examination's anamnesis."
            ></mm-input>

            <!--
              'readonly' is bound to the store's lock, not to 'form.disabled'. Neither of these two
              children contains a form control — the diagnosis arrives over the event bus and the
              prescriptions live in the store — so 'this.form.disable()' below does not reach them.
              Without this binding the "Clear" button and the prescription dialog stay live during
              the POST, which the store now also refuses, but a control that visibly does nothing
              when pressed is its own defect.
            -->
            <exam-diagnosis-panel
                [submitAttempted]="submitAttempted()"
                [readonly]="draft.isLocked()"
            ></exam-diagnosis-panel>

            <mm-input
                label="Therapy instructions"
                formControlName="therapyDescription"
                multiline
                [rows]="3"
                required
                placeholder="Prescribed therapy and how to follow it…"
                [error]="therapyError()"
                hint="Applies to the therapy as a whole; per-medicine instructions go below."
            ></mm-input>

            <exam-prescription-list [readonly]="draft.isLocked()"></exam-prescription-list>

            @if (draft.submitError(); as message) {
                <!--
                  Rendered inline as well as published as a toast. 'notifications' is a live
                  channel with no queue, so a toast emitted while it is unmounted is simply lost —
                  and a failed submit is the one message that must survive that.
                -->
                <p class="exam-form__error" role="alert">{{ message }}</p>
            }

            @if (!canSubmit() && !draft.isSubmitting()) {
                <p class="exam-form__blocked" role="status">{{ blockedReason() }}</p>
            }

            <div class="exam-form__actions">
                <mm-button
                    type="submit"
                    variant="primary"
                    label="Record examination"
                    [loading]="draft.isSubmitting()"
                    [disabled]="!canSubmit()"
                ></mm-button>
                <mm-button
                    type="button"
                    variant="tertiary"
                    label="Discard"
                    [disabled]="draft.isSubmitting()"
                    (click)="discard()"
                ></mm-button>
            </div>
        </form>
    `,
})
export class ExaminationFormComponent {
    private readonly formBuilder = inject(FormBuilder);
    private readonly bus = inject(EventBusService);

    protected readonly draft = inject(ExaminationDraftStore);

    /** Set on the first submit attempt, which is when validation messages start speaking. */
    protected readonly submitAttempted = signal(false);

    protected readonly form = this.formBuilder.nonNullable.group({
        startTime: [
            toDateTimeLocalInput(new Date()),
            [
                Validators.required,
                notInFuture(CLOCK_SKEW_TOLERANCE_MS),
                notBefore(EARLIEST_PLAUSIBLE_START),
            ],
        ],
        anamnesis: [
            '',
            [
                Validators.required,
                notBlank(),
                minTrimmedLength(ANAMNESIS_MIN_LENGTH),
                // The column is TEXT, so this is a sanity bound rather than a schema limit.
                Validators.maxLength(4000),
            ],
        ],
        therapyDescription: [
            '',
            [
                Validators.required,
                notBlank(),
                minTrimmedLength(THERAPY_MIN_LENGTH),
                Validators.maxLength(2000),
            ],
        ],
    });

    /**
     * Error text per field.
     *
     * Plain methods, deliberately **not** `computed()`. A `computed` only recomputes when a signal
     * it read changes, and `AbstractControl.errors` / `touched` are not signals in this version of
     * `@angular/forms` — so a `computed` wrapping `firstErrorMessage` would evaluate once and then
     * report the same answer forever. Called from the template they are re-evaluated on each change
     * detection pass instead, which is exactly when the control's state can have moved.
     */
    protected readonly startTimeError = (): string =>
        firstErrorMessage(this.form.controls.startTime, FIELD_LABELS.startTime);

    protected readonly anamnesisError = (): string =>
        firstErrorMessage(this.form.controls.anamnesis, FIELD_LABELS.anamnesis);

    protected readonly therapyError = (): string =>
        firstErrorMessage(this.form.controls.therapyDescription, FIELD_LABELS.therapyDescription);

    protected readonly canSubmit = (): boolean =>
        this.form.valid && this.draft.hasRequiredContext() && !this.draft.isSubmitting();

    /**
     * Why the submit is blocked, in the doctor's terms.
     *
     * Worth the extra branch: the diagnosis is not a field on this form, so a doctor looking at a
     * fully filled form with a dead submit button has no way to discover that the missing piece is
     * in the pane beside it.
     */
    protected readonly blockedReason = (): string => {
        if (!this.draft.appointment()) return 'Select an appointment before recording the examination.';
        if (!this.draft.diagnosis()) {
            return 'Select a diagnosis from the ICD-10 catalogue beside this form.';
        }

        const incomplete = (Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>)
            .filter((field) => this.form.controls[field].invalid)
            .map((field) => FIELD_LABELS[field]);
        if (incomplete.length > 0) {
            return `Please complete the following fields: ${incomplete.join(', ')}.`;
        }
        return 'Please complete the highlighted fields.';
    };

    protected async submit(): Promise<void> {
        this.submitAttempted.set(true);

        if (this.form.invalid) {
            // Errors are hidden until a control is touched, so a submit attempt has to reveal them.
            this.form.markAllAsTouched();
            return;
        }
        if (!this.draft.hasRequiredContext() || this.draft.isSubmitting()) return;

        const { anamnesis, therapyDescription, startTime } = this.form.getRawValue();
        const request = this.draft.buildRequest(anamnesis, therapyDescription, startTime);
        // `buildRequest` returns null only if the context vanished between the guard above and
        // here — possible, since a logout resets the store from an event.
        if (!request) return;

        this.draft.beginSubmit();
        // Locked rather than left editable: a field edited while the POST is in flight would not be
        // in the request, and the summary that follows would disagree with what is on screen.
        this.form.disable({ emitEvent: false });

        try {
            const result = await examinationService.examine(request);
            this.draft.completeSubmit(result);
            this.bus.notify('success', `Examination #${result.id} recorded.`);
        } catch (error) {
            const message = examineErrorMessage(error);
            this.draft.failSubmit(message);
            this.bus.notify('error', message);
            // Re-enable so the doctor can correct and retry. Most of the 400s from
            // `ExaminationService.examine` are recoverable by editing the form.
            this.form.enable({ emitEvent: false });
        }
    }

    /**
     * Clears the form and the draft, for a doctor who picked the wrong appointment.
     *
     * The form is reset explicitly rather than left to the component being destroyed: clearing the
     * appointment moves `phase()` back to `selecting-appointment`, which does destroy this
     * component — but the store also drives the picker, and a doctor who re-selects the *same*
     * appointment must not find the previous anamnesis waiting for them.
     */
    protected discard(): void {
        this.submitAttempted.set(false);
        this.form.reset({
            startTime: toDateTimeLocalInput(new Date()),
            anamnesis: '',
            therapyDescription: '',
        });
        this.draft.reset();
    }
}
