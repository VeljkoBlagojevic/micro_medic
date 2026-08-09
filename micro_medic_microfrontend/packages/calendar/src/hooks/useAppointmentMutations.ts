import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventBus } from '@micro-medic/shared-store';
import { EventTypes } from '@micro-medic/shared-types';
import type {
    AppointmentRequest,
    ScheduledAppointmentDto
} from '@micro-medic/shared-types';
import { calendarService } from '../services/calendar.service';
import { queryKeys } from '../state';

export function useAppointmentMutations() {
    const queryClient = useQueryClient();

    /*
     * `invalidateQueries` returns a promise that settles when the refetch it triggers completes.
     * Nothing here awaits it — the refetch drives the query's own `isFetching`/`data`, which is
     * what the UI already renders — but a rejection still has to go somewhere, or a failed
     * refetch is an unhandled rejection and the list silently keeps showing stale appointments.
     */
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.calendar }).catch((error: unknown) => {
            console.error('[calendar] Failed to refresh appointments after a mutation:', error);
        });
    }

    const notifySuccess = (message: string) => eventBus.emit(EventTypes.NOTIFICATION_SHOW, {
        message,
        type: 'success'
    });

    const book = useMutation<ScheduledAppointmentDto, unknown, AppointmentRequest>({
        mutationFn: calendarService.book,
        onSuccess: () => {
            invalidate();
            notifySuccess('Appointment booked successfully.');
        }
    });

    const reschedule = useMutation<ScheduledAppointmentDto, unknown, { appointmentId: number, rescheduleRequest: AppointmentRequest }>({
        mutationFn: ({ appointmentId, rescheduleRequest }) => calendarService.reschedule(appointmentId, rescheduleRequest),
        onSuccess: () => {
            invalidate();
            notifySuccess('Appointment rescheduled successfully.');
        }
    });

    const cancel = useMutation<ScheduledAppointmentDto, unknown, number>({
        mutationFn: calendarService.cancel,
        onSuccess: () => {
            invalidate();
            notifySuccess('Appointment canceled successfully.');
        }
    });

    return {
        book,
        reschedule,
        cancel
    };
}
