import { useCallback, useState } from 'react';
import { MmButton, MmEmptyState, MmErrorState, MmSpinner } from '@micro-medic/design-system-react';
import { eventBus } from '@micro-medic/shared-store';
import { EventTypes, Role, type ScheduledAppointmentDto } from '@micro-medic/shared-types';
import {
    AppointmentCard,
    BookingModal,
    CalendarView,
    CancelConfirm,
    RescheduleModal,
} from './components';
import { useCalendar } from './hooks/useCalendar';
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

    // Only the *id* is held in state; the DTO is read back out of the freshly-fetched events.
    // Storing the DTO itself left the detail pane showing a stale snapshot after a mutation —
    // cancel an appointment and it still read "Scheduled" with both action buttons live.
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selected = events.find((event) => event.id === selectedId)?.resource ?? null;

    const [dialog, setDialog] = useState<Dialog>({ kind: 'none' });

    const isDoctor = role === Role.DOCTOR;
    const isPatient = role === Role.PATIENT;

    const closeDialog = useCallback(() => setDialog({ kind: 'none' }), []);

    const onSelectEvent = useCallback((event: CalendarEvent) => {
        setSelectedId(event.id);
        // Announce the selection so sibling micro-frontends can react — this is the one
        // outbound event the calendar owns, and `examination` is its intended consumer.
        eventBus.emit(EventTypes.CALENDAR_APPOINTMENT_SELECTED, { appointment: event.resource });
    }, []);

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
                                // A doctor reschedules; either party may cancel. `CalendarService.cancel`
                                // currently checks `requireSelfDoctor` first, so a patient's cancel is
                                // rejected by the backend — see the known-defects list in CLAUDE.md.
                                canReschedule={isDoctor}
                                canCancel={isDoctor || isPatient}
                                onReschedule={(appointment) => setDialog({ kind: 'reschedule', appointment })}
                                onCancel={(appointment) => setDialog({ kind: 'cancel', appointment })}
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
