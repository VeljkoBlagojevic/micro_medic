import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
    MmButtonDirective,
    MmEmptyStateDirective,
    MmErrorStateDirective,
    MmSpinnerDirective,
    MmTableDirective,
    type MmRowClickEvent,
    type MmTableColumn,
} from '@micro-medic/design-system-angular';
import { AppointmentStatus, type ScheduledAppointmentDto } from '@micro-medic/shared-types';
import { calendarService } from '../services/calendar.service.js';
import { createAsyncListState } from '../state/async-state.js';
import { ExaminationDraftStore } from '../state/examination-draft.store.js';
import { formatTimeRange } from '../utils/date-time.js';
import { loadErrorMessage } from '../utils/error-message.js';

/**
 * The table row shape. Flat and pre-formatted, because `mm-table` renders strings.
 *
 * A `type` alias, not an `interface`: `MmTableColumn<TRow extends MmTableRow>` constrains the row to
 * `Record<string, unknown>`, and only an object *type* gets the implicit index signature that
 * satisfies it. Declared as an interface this fails with TS2344 and takes the two template bindings
 * down with it.
 */
type AppointmentRow = {
    id: number;
    patient: string;
    when: string;
    /** Kept so the row-click handler can hand the real DTO to the store. */
    dto: ScheduledAppointmentDto;
};

/**
 * Chooses which appointment the examination is being recorded for.
 *
 * The doctor normally arrives here from the calendar's "Record examination" button, which carries the
 * appointment id in `?appointmentId=`; `ExaminationApp` adopts it before this pane would render, so
 * on that path it never does. It exists for the two other ways in — opening `/examination` directly,
 * and a handoff the backend refused (someone else's appointment, or one since deleted), which lands
 * here with `draft.adoptError()` shown above the table. Without it the screen would be a form that
 * can never be submitted, with no way to say why.
 *
 * Only `SCHEDULED` appointments are offered: `ExaminationService.examine` rejects any other status
 * outright, and offering a `COMPLETED` one would be an invitation to a guaranteed 400.
 */
@Component({
    selector: 'exam-appointment-picker',
    standalone: true,
    imports: [
        MmTableDirective,
        MmButtonDirective,
        MmSpinnerDirective,
        MmEmptyStateDirective,
        MmErrorStateDirective,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <section class="exam-picker" aria-labelledby="exam-picker-heading">
            <header class="exam-picker__header">
                <h3 class="exam-picker__heading" id="exam-picker-heading">Select an appointment</h3>
                <p class="exam-picker__hint mm-muted">
                    An examination is recorded against a scheduled appointment — that is how the
                    patient is identified. Pick one from the calendar, or choose below.
                </p>
            </header>

            @if (appointments.isInitialLoading()) {
                <mm-spinner label="Loading your appointments…" centered></mm-spinner>
            } @else if (appointments.error(); as message) {
                <mm-error-state
                    heading="Could not load appointments"
                    [message]="message"
                    retryable
                    retryLabel="Try again"
                    (retry)="load()"
                ></mm-error-state>
            } @else if (rows().length === 0) {
                <mm-empty-state
                    heading="No scheduled appointments"
                    description="Only appointments that are still scheduled can be examined. Book one in the calendar first."
                ></mm-empty-state>
            } @else {
                <mm-table
                    [columns]="columns"
                    [rows]="rows()"
                    caption="Your scheduled appointments"
                    rowKey="id"
                    clickable
                    (rowClick)="onRowClick($event)"
                ></mm-table>
                <div class="exam-picker__actions">
                    <mm-button
                        variant="secondary"
                        size="sm"
                        label="Refresh"
                        [loading]="appointments.isLoading()"
                        (click)="load()"
                    ></mm-button>
                </div>
            }
        </section>
    `,
})
export class AppointmentPickerComponent {
    private readonly draft = inject(ExaminationDraftStore);

    protected readonly appointments = createAsyncListState<ScheduledAppointmentDto>();

    protected readonly columns: MmTableColumn<AppointmentRow>[] = [
        { key: 'patient', label: 'Patient' },
        { key: 'when', label: 'Scheduled' },
    ];

    constructor() {
        void this.load();
    }

    /**
     * `rows` is derived rather than stored: the page from the backend is the truth, and a second
     * array kept in sync with it is a second thing to get wrong.
     */
    protected readonly rows = (): AppointmentRow[] =>
        (this.appointments.data() ?? [])
            .filter((appointment) => appointment.status === AppointmentStatus.SCHEDULED)
            .map((appointment) => ({
                id: appointment.id,
                patient: `${appointment.patient.firstname} ${appointment.patient.lastname}`,
                when: formatTimeRange(appointment.start, appointment.end),
                dto: appointment,
            }));

    protected async load(): Promise<void> {
        await this.appointments.run(
            // Sorted ascending and generously sized: the status filter runs client-side, so a page
            // of ten could easily contain no schedulable appointment at all and look empty.
            async () => {
                const page = await calendarService.list({ page: 0, size: 50, sort: 'start,asc' });
                return page.content;
            },
            (error) => loadErrorMessage(error, 'your appointments')
        );
    }

    /**
     * `$event.detail.row` is typed because `MmTableDirective` is generic over the row type — the
     * whole reason to bind through the directive rather than write the raw tag with
     * `CUSTOM_ELEMENTS_SCHEMA`, which would leave this an untyped `any` reached through
     * `addEventListener`.
     */
    protected onRowClick(event: MmRowClickEvent<AppointmentRow>): void {
        this.draft.selectAppointment(event.detail.row.dto);
    }
}
