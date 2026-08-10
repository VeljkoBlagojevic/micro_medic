import { Injectable, computed, inject, signal } from '@angular/core';
import { EventTypes } from '@micro-medic/shared-store';
import type {
    DiseaseDto,
    ExaminationDetailDto,
    ExaminationRequest,
    MedicineDto,
    ScheduledAppointmentDto,
} from '@micro-medic/shared-types';
import { AppointmentStatus } from '@micro-medic/shared-types';
import {
    nextDraftId,
    toMedicineUsageRequest,
    type PrescriptionDraft,
} from '../models/prescription.js';
import { toSubmittableStartTime } from '../utils/date-time.js';
import { EventBusService } from './event-bus.service.js';

/** Where the examination is in its lifecycle. Drives which pane the shell renders. */
export type DraftPhase =
    /** No appointment chosen — the doctor must pick one before anything else is meaningful. */
    | 'selecting-appointment'
    /** An appointment is chosen and the form is being filled in. */
    | 'editing'
    /** `POST /api/examinations` is in flight. */
    | 'submitting'
    /** Recorded. The result is shown and the form is locked. */
    | 'recorded';

/**
 * The single source of truth for an in-progress examination.
 *
 * Everything the doctor assembles across four separate panes — the appointment, the anamnesis, the
 * diagnosis that arrives *from another micro-frontend over the event bus*, and the prescription
 * list — converges here. Splitting this across the components that collect each piece was the
 * alternative, and it does not survive the diagnosis: `ICD10_DISEASE_SELECTED` is published by a
 * remote that has no reference to any component in this package, so something injector-scoped has
 * to receive it. Once one field lives in a store, all of them should, or "the current examination"
 * stops having a single answer.
 *
 * Signals rather than an `rxjs` `BehaviorSubject` per field: the derived values below (`canSubmit`,
 * `phase`, `patient`) are the interesting part, and `computed` expresses them without a
 * `combineLatest` whose subscription lifetime someone has to manage.
 *
 * The anamnesis and start time are *not* here — they live in the reactive form, which already owns
 * validation state for them (`touched`, `errors`, and the `ControlValueAccessor` that
 * `MmInputDirective` implements). Duplicating them into a signal would mean two systems holding one
 * truth. What this store holds is everything the form cannot: values that arrive from outside it.
 */
@Injectable({ providedIn: 'root' })
export class ExaminationDraftStore {
    private readonly bus = inject(EventBusService);

    // --- raw state -------------------------------------------------------------------

    private readonly appointmentSignal = signal<ScheduledAppointmentDto | null>(null);
    private readonly diagnosisSignal = signal<DiseaseDto | null>(null);
    private readonly prescriptionsSignal = signal<readonly PrescriptionDraft[]>([]);
    private readonly submittingSignal = signal(false);
    private readonly resultSignal = signal<ExaminationDetailDto | null>(null);
    private readonly submitErrorSignal = signal<string | null>(null);

    // --- readonly views --------------------------------------------------------------

    readonly appointment = this.appointmentSignal.asReadonly();
    readonly diagnosis = this.diagnosisSignal.asReadonly();
    readonly prescriptions = this.prescriptionsSignal.asReadonly();
    readonly result = this.resultSignal.asReadonly();
    readonly submitError = this.submitErrorSignal.asReadonly();

    readonly patient = computed(() => this.appointmentSignal()?.patient ?? null);

    readonly phase = computed<DraftPhase>(() => {
        if (this.resultSignal()) return 'recorded';
        if (this.submittingSignal()) return 'submitting';
        return this.appointmentSignal() ? 'editing' : 'selecting-appointment';
    });

    /**
     * The two preconditions the *form* cannot express, because neither field is in it.
     *
     * `ExaminationRequest.diagnosisCode` is `@NotBlank` and the appointment id is what the backend
     * traverses to reach the patient (`Examination` has no direct patient field), so a submit
     * missing either can only 400. Combined with the form's own validity by `CanSubmit` in the
     * shell component — deliberately separate, so each half reports the specific thing that is
     * missing rather than one blanket "form is invalid".
     */
    readonly hasRequiredContext = computed(
        () => this.appointmentSignal() !== null && this.diagnosisSignal() !== null
    );

    readonly isSubmitting = computed(() => this.submittingSignal());

    /** True once recorded, which is what locks every field and hides the submit button. */
    readonly isRecorded = computed(() => this.resultSignal() !== null);

    /**
     * No further edits accepted — recorded, or a submit is in flight.
     *
     * The in-flight half is easy to miss. `form.disable()` locks the *form controls*, but the
     * diagnosis "Clear" button and the prescription dialog are not form controls: they mutate this
     * store directly. `buildRequest` has already snapshotted its values by then, so a late edit
     * cannot corrupt the request — what it does is leave the screen disagreeing with what was sent,
     * so a doctor who retries after a failure silently retries with different data.
     */
    readonly isLocked = computed(() => this.isRecorded() || this.submittingSignal());

    constructor() {
        /*
         * The horizontal split's entire coupling, in two subscriptions.
         *
         * `icd10` sits beside this form on `/examination` and publishes the selected disease; the
         * calendar publishes the appointment the doctor clicked. Neither imports this package and
         * this package imports neither of them, so all three can be redeployed independently —
         * that decoupling is the architectural claim the split is here to demonstrate, and these
         * two lines are where it is cashed in.
         *
         * Registered through `EventBusService.listen`, so both are torn down when this injector is
         * destroyed. single-spa unmounts this application on every route change away from
         * `/examination`, and a leaked listener would leave a dead store mutating itself.
         */
        this.bus.listen(EventTypes.ICD10_DISEASE_SELECTED, ({ disease }) => {
            // Ignore traffic once locked. Recorded is the obvious case — the result is immutable,
            // and quietly swapping its diagnosis in the UI would misrepresent what was saved. But
            // in-flight matters too: `buildRequest` has already taken its snapshot, so a click in
            // the ICD-10 pane during the POST would leave the screen showing a diagnosis that was
            // never submitted.
            if (this.isLocked()) return;
            this.diagnosisSignal.set(disease);
            this.submitErrorSignal.set(null);
        });

        this.bus.listen(EventTypes.CALENDAR_APPOINTMENT_SELECTED, ({ appointment }) => {
            // `selectAppointment` re-checks the lock; this is only here so the intent reads at the
            // subscription rather than two calls away.
            if (this.isLocked()) return;
            this.selectAppointment(appointment);
        });

        /*
         * A logout must not leave one patient's anamnesis on screen for whoever signs in next.
         * `notifications` clears its toasts for the same reason — a toast may name a patient from
         * the session that just ended.
         */
        this.bus.listen(EventTypes.AUTH_LOGOUT, () => this.reset());
    }

    // --- commands --------------------------------------------------------------------

    /**
     * Chooses the appointment this examination is for.
     *
     * Switching to a *different* appointment discards the prescriptions: they were chosen for the
     * previous patient, and silently carrying them over is a prescribing error, not a convenience.
     * Re-selecting the same appointment changes nothing.
     */
    selectAppointment(appointment: ScheduledAppointmentDto): void {
        if (this.isLocked()) return;

        const current = this.appointmentSignal();
        if (current?.id === appointment.id) return;

        this.appointmentSignal.set(appointment);
        this.prescriptionsSignal.set([]);
        this.submitErrorSignal.set(null);
    }

    clearAppointment(): void {
        if (this.isLocked()) return;
        this.appointmentSignal.set(null);
        this.prescriptionsSignal.set([]);
        this.submitErrorSignal.set(null);
    }

    clearDiagnosis(): void {
        if (this.isLocked()) return;
        this.diagnosisSignal.set(null);
    }

    /**
     * Adds a prescription.
     *
     * Returns `false` when the same medicine is already prescribed at the same interval — a
     * genuine duplicate, as opposed to the same medicine at a different interval, which is a real
     * clinical instruction (a loading dose then a maintenance dose) and is allowed. The caller
     * surfaces the rejection; failing silently would look like a broken button.
     */
    addPrescription(medicine: MedicineDto, methodUse: string, frequencyInHours: number): boolean {
        if (this.isLocked()) return false;

        const duplicate = this.prescriptionsSignal().some(
            (existing) =>
                existing.medicine.id === medicine.id &&
                existing.frequencyInHours === frequencyInHours
        );
        if (duplicate) return false;

        this.prescriptionsSignal.update((current) => [
            ...current,
            {
                draftId: nextDraftId(),
                medicine,
                methodUse: methodUse.trim(),
                frequencyInHours,
            },
        ]);
        return true;
    }

    removePrescription(draftId: string): void {
        if (this.isLocked()) return;
        this.prescriptionsSignal.update((current) =>
            current.filter((draft) => draft.draftId !== draftId)
        );
    }

    // --- submission ------------------------------------------------------------------

    /**
     * Builds the request body, or `null` when the context this store owns is incomplete.
     *
     * Returning `null` rather than throwing keeps the caller's happy path linear, and the guard is
     * not redundant with `hasRequiredContext`: that signal drives the UI, whereas this is the last
     * check before a network call, and the two are read at different moments.
     */
    buildRequest(anamnesis: string, therapyInstructions: string, startTime: string): ExaminationRequest | null {
        const appointment = this.appointmentSignal();
        const diagnosis = this.diagnosisSignal();
        if (!appointment || !diagnosis) return null;

        return {
            scheduledAppointmentId: appointment.id,
            // Clamped to now, so a client clock running ahead of the server's cannot trip
            // `@PastOrPresent` on a form the doctor filled in correctly.
            startTime: toSubmittableStartTime(startTime),
            medicalHistory: anamnesis.trim(),
            diagnosisCode: diagnosis.code,
            therapyDescription: therapyInstructions.trim(),
            medicineUsages: this.prescriptionsSignal().map(toMedicineUsageRequest),
        };
    }

    beginSubmit(): void {
        this.submittingSignal.set(true);
        this.submitErrorSignal.set(null);
    }

    /**
     * Records the outcome and locks the draft.
     *
     * Also flips the local copy of the appointment to `COMPLETED`: `ExaminationService.examine`
     * does that server-side in the same transaction, and leaving the pane showing `SCHEDULED`
     * would contradict the success message beside it. This copy is local only — the authoritative
     * one is refetched by whoever renders appointments, which is why `EXAMINATION_COMPLETED` is
     * emitted here and `calendar`'s `useExaminationSync` invalidates its query on it rather than
     * trusting this payload.
     */
    completeSubmit(result: ExaminationDetailDto): void {
        this.submittingSignal.set(false);
        this.resultSignal.set(result);
        this.appointmentSignal.update((appointment) =>
            appointment ? { ...appointment, status: AppointmentStatus.COMPLETED } : appointment
        );
        this.bus.emit(EventTypes.EXAMINATION_COMPLETED, { examinationId: result.id });
    }

    failSubmit(message: string): void {
        this.submittingSignal.set(false);
        this.submitErrorSignal.set(message);
    }

    /** Clears everything — used after a recorded examination and on logout. */
    reset(): void {
        this.appointmentSignal.set(null);
        this.diagnosisSignal.set(null);
        this.prescriptionsSignal.set([]);
        this.submittingSignal.set(false);
        this.resultSignal.set(null);
        this.submitErrorSignal.set(null);
    }
}
