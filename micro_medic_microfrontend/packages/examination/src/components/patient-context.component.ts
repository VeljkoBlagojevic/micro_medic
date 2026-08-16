import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import {
    MmButtonDirective,
    MmCardDirective,
    MmSpinnerDirective,
} from '@micro-medic/design-system-angular';
import { AppointmentStatus, type ExaminationDto } from '@micro-medic/shared-types';
import { examinationService } from '../services/examination.service.js';
import { createAsyncListState } from '../state/async-state.js';
import { ExaminationDraftStore } from '../state/examination-draft.store.js';
import { formatDateTime, formatTimeRange } from '../utils/date-time.js';
import { loadErrorMessage } from '../utils/error-message.js';

/**
 * Who is being examined, and what came before.
 *
 * The history is the clinically important half: prescribing without knowing what the patient was
 * last diagnosed with is exactly the mistake a system like this should make hard. It is a plain
 * read of `GET /api/examinations/patient/{id}`, which `AccessGuard.requirePatientAccess`
 * authorises row-by-row — a doctor with no appointment for this patient gets a 403, **and the
 * attempt is written to `medical_access_log`**. So the failure branch here is not a bug to hide;
 * it is the audit trail working, and it says so plainly.
 */
@Component({
    selector: 'exam-patient-context',
    standalone: true,
    imports: [MmCardDirective, MmSpinnerDirective, MmButtonDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (draft.patient(); as patient) {
            <mm-card heading="Patient">
                <dl class="exam-context__list">
                    <dt class="exam-context__term">Name</dt>
                    <dd class="exam-context__value">{{ patient.firstname }} {{ patient.lastname }}</dd>

                    <dt class="exam-context__term">Email</dt>
                    <dd class="exam-context__value">{{ patient.email }}</dd>

                    @if (draft.appointment(); as appointment) {
                        <dt class="exam-context__term">Appointment</dt>
                        <dd class="exam-context__value">
                            {{ formatSlot(appointment.start, appointment.end) }}
                            <span
                                class="exam-context__status"
                                [class.exam-context__status--done]="isCompleted()"
                                >{{ appointment.status }}</span
                            >
                        </dd>
                    }
                </dl>

                <div slot="footer" class="exam-context__history">
                    <h4 class="exam-context__subheading">Previous examinations</h4>

                    @if (history.isInitialLoading()) {
                        <mm-spinner size="sm" label="Loading history…"></mm-spinner>
                    } @else if (history.error(); as message) {
                        <p class="exam-context__error" role="status">{{ message }}</p>
                        <mm-button
                            variant="tertiary"
                            size="sm"
                            label="Retry"
                            (click)="loadHistory()"
                        ></mm-button>
                    } @else if (recent().length === 0) {
                        <p class="exam-context__empty mm-muted">
                            No earlier examinations on record for this patient.
                        </p>
                    } @else {
                        <ul class="exam-context__timeline">
                            @for (item of recent(); track item.id) {
                                <li class="exam-context__entry">
                                    <span class="exam-context__when">{{ formatWhen(item.start) }}</span>
                                    <span class="exam-context__diagnosis">
                                        @if (item.disease) {
                                            <strong>{{ item.disease.code }}</strong>
                                            —
                                            {{ item.disease.description }}
                                        } @else {
                                            <span class="mm-muted">No diagnosis recorded</span>
                                        }
                                    </span>
                                </li>
                            }
                        </ul>
                        @if (hasMore()) {
                            <p class="exam-context__more mm-muted">
                                Showing the {{ recent().length }} most recent of
                                {{ totalCount() }}.
                            </p>
                        }
                    }
                </div>
            </mm-card>
        }
    `,
})
export class PatientContextComponent {
    protected readonly draft = inject(ExaminationDraftStore);

    protected readonly history = createAsyncListState<ExaminationDto>();

    /**
     * Total on the server, so the pane can say what it is *not* showing.
     *
     * A signal, like every other piece of state in this package — under zoneless change detection a
     * plain field written from a promise callback has nothing to notify the view, and would only
     * appear to work because the sibling `history` signals happen to be written in the same turn.
     */
    private readonly total = signal(0);

    private readonly HISTORY_LIMIT = 5;

    protected readonly isCompleted = computed(
        () => this.draft.appointment()?.status === AppointmentStatus.COMPLETED
    );

    protected readonly recent = computed(() => (this.history.data() ?? []).slice(0, this.HISTORY_LIMIT));

    protected readonly totalCount = this.total.asReadonly();
    protected readonly hasMore = computed(() => this.total() > this.recent().length);

    constructor() {
        /*
         * Refetch whenever the patient changes.
         *
         * An `effect` rather than a call in the appointment-selection path: the appointment can be
         * set from three places — this MFE's picker, the `?appointmentId=` handoff from the calendar,
         * and a reset on logout — and making each one remember to refresh is how a stale pane happens.
         * Keyed on the patient id, not the appointment, so switching between two appointments for the
         * same patient does not refetch identical data.
         *
         * All three paths reach the patient through a fetch this MFE made — the handoff carries an id,
         * never a DTO — so nothing here renders without `AccessGuard` having allowed it.
         */
        let lastPatientId: number | null = null;

        effect(() => {
            const patientId = this.draft.patient()?.id ?? null;
            if (patientId === lastPatientId) return;
            lastPatientId = patientId;

            if (patientId === null) {
                this.history.reset();
                this.total.set(0);
                return;
            }
            void this.loadHistory();
        });
    }

    protected async loadHistory(): Promise<void> {
        const patientId = this.draft.patient()?.id;
        if (patientId === undefined) return;

        await this.history.run(
            async () => {
                const page = await examinationService.forPatient(patientId, {
                    page: 0,
                    size: this.HISTORY_LIMIT,
                    sort: 'start,desc',
                });
                this.total.set(page.totalElements);
                return page.content;
            },
            (error) => loadErrorMessage(error, 'the examination history')
        );
    }

    protected formatSlot = formatTimeRange;
    protected formatWhen = formatDateTime;
}
