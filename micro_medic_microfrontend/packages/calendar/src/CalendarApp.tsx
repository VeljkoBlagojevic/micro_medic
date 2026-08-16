import { useCallback, useState } from 'react';
import { MmButton, MmEmptyState, MmErrorState, MmSpinner } from '@micro-medic/design-system-react';
import { eventBus } from '@micro-medic/shared-store';
import {
    APPOINTMENT_HANDOFF_PARAM,
    EventTypes,
    Role,
    type ScheduledAppointmentDto
} from '@micro-medic/shared-types';
import {
    AppointmentCard,
    BookingModal,
    CalendarView,
    CancelConfirm,
    RescheduleModal,
} from './components';
import { useCalendar } from './hooks/useCalendar';
import { useExaminationSync } from './hooks/useExaminationSync';
import { useNavigate } from './hooks/useNavigate';
import { useAuthState, useCalendarView } from './state';
import { loadErrorMessage } from './utils';
import type { CalendarEvent } from './types';

// react-big-calendar ships its own stylesheet and is unusable without it — the grid collapses.
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.css';

/** Which modal, if any, is open. Mutually exclusive, so one state field rather than three booleans. */
type Dialog =
    | { kind: 'none' }
    | { kind: 'book' }
    | { kind: 'reschedule'; appointment: ScheduledAppointmentDto }
    | { kind: 'cancel'; appointment: ScheduledAppointmentDto };

export const CalendarApp = () => {
    // `role` is `user?.role` derived by the store — read it from one place rather than both.
    const { role, isAuthenticated } = useAuthState();
    // The viewer's role decides whose name titles each event — a patient wants to see the
    // doctor, a doctor wants to see the patient.
    const { events, isLoading, isError, error, isFetching, refetch } = useCalendar(role);
    const { view, date, onView, onNavigate } = useCalendarView();

    // Inbound half of the split with `examination`: refetch when a sibling MFE records an
    // examination, which completes one of these appointments server-side.
    useExaminationSync();

    // Only the *id* is held in state; the DTO is read back out of the freshly-fetched events.
    // Storing the DTO itself left the detail pane showing a stale snapshot after a mutation —
    // cancel an appointment and it still read "Scheduled" with both action buttons live.
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selected = events.find((event) => event.id === selectedId)?.resource ?? null;

    const [dialog, setDialog] = useState<Dialog>({ kind: 'none' });

    const isDoctor = role === Role.DOCTOR;
    const isPatient = role === Role.PATIENT;

    const closeDialog = useCallback(() => setDialog({ kind: 'none' }), []);
    const navigate = useNavigate();

    const onSelectEvent = useCallback((event: CalendarEvent) => {
        setSelectedId(event.id);
        // The id only, never the DTO — a consumer must fetch through an authorized endpoint. Nothing
        // can hear this today; see the reachability table in `shared-types/src/events.ts`.
        eventBus.emit(EventTypes.CALENDAR_APPOINTMENT_SELECTED, { appointmentId: event.id });
    }, []);

    /**
     * The handoff to `examination`. It travels in the URL because it has to survive a mount boundary:
     * this MFE unmounts the instant the navigation resolves, so the bus could not deliver it. Only
     * the id crosses — `examination` re-fetches, which is what keeps the read behind `AccessGuard`.
     *
     * The parameter name is shared; the path is not. A wrong parameter is a screen that opens empty
     * with no error anywhere, while a wrong path is a blank route found immediately — and the routing
     * table belongs to the shell, so a remote has no business holding a constant for it.
     */
    const onRecordExamination = useCallback(
        (appointment: ScheduledAppointmentDto) => {
            navigate(`/examination?${APPOINTMENT_HANDOFF_PARAM}=${appointment.id}`);
        },
        [navigate]
    );

    if (!isAuthenticated) {
        return (
            <MmEmptyState
                heading="Sign in to view the calendar"
                description="Your appointments appear here once you are logged in."
            />
        );
    }

    return (
        <div className="cal-root">
            <header className="cal-header">
                <div>
                    <h1 className="cal-title">Appointments</h1>
                    <p className="cal-subtitle">
                        {isDoctor ? 'Appointments with your patients' : 'Your upcoming appointments'}
                        {isFetching && !isLoading ? ' · refreshing…' : ''}
                    </p>
                </div>
                {/* Only a doctor may create an appointment: `POST /api/calendar` requires ROLE_DOCTOR. */}
                {isDoctor && (
                    <MmButton variant="primary" onClick={() => setDialog({ kind: 'book' })}>
                        Book appointment
                    </MmButton>
                )}
            </header>

            <div className="cal-body">
                {isLoading ? (
                    <MmSpinner centered label="Loading appointments…" />
                ) : isError ? (
                    <MmErrorState
                        heading="Could not load the calendar"
                        message={loadErrorMessage(error)}
                        retryable
                        onRetry={() => void refetch()}
                    />
                ) : events.length === 0 ? (
                    <MmEmptyState
                        heading="No appointments yet"
                        description={
                            isDoctor
                                ? 'Book an appointment to get started.'
                                : 'You have no scheduled appointments.'
                        }
                    />
                ) : (
                    <div className="cal-main">
                        <CalendarView
                            events={events}
                            view={view}
                            date={date}
                            onView={onView}
                            onNavigate={onNavigate}
                            onSelectEvent={onSelectEvent}
                        />
                        {selected && (
                            <AppointmentCard
                                appointment={selected}
                                // A doctor reschedules; either party may cancel. That matches
                                // `CalendarService.cancel`, which authorises with
                                // `requireAppointmentAccess` (either participant) rather than
                                // `requireSelfDoctor` — so a patient's cancel is accepted.
                                canReschedule={isDoctor}
                                canCancel={isDoctor || isPatient}
                                canRecordExamination={isDoctor}
                                onReschedule={(appointment) => setDialog({ kind: 'reschedule', appointment })}
                                onCancel={(appointment) => setDialog({ kind: 'cancel', appointment })}
                                onRecordExamination={onRecordExamination}
                                onClose={() => setSelectedId(null)}
                            />
                        )}
                    </div>
                )}
            </div>

            <BookingModal open={dialog.kind === 'book'} onClose={closeDialog} />
            <RescheduleModal
                appointment={dialog.kind === 'reschedule' ? dialog.appointment : null}
                onClose={closeDialog}
            />
            <CancelConfirm
                appointment={dialog.kind === 'cancel' ? dialog.appointment : null}
                onClose={closeDialog}
            />
        </div>
    );
};
