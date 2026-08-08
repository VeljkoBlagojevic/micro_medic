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

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.calendar });
    }

    const notifySuccess = (message: string) => eventBus.emit(EventTypes.NOTIFICATION_SHOW, {
        message, type: 'success',
        id: ''
    });

    const book = useMutation<ScheduledAppointmentDto, unknown, AppointmentRequest>({
        mutationFn: calendarService.book,
        onSuccess: () => {
            invalidate();
            notifySuccess('Appointment booked successfully.');
        }
    });

    const reschedule = useMutation<ScheduledAppointmentDto, unknown, { appointmentId: string, rescheduleRequest: AppointmentRequest }>({
        mutationFn: ({ appointmentId, rescheduleRequest }) => calendarService.reschedule(appointmentId, rescheduleRequest),
        onSuccess: () => {
            invalidate();
            notifySuccess('Appointment rescheduled successfully.');
        }
    });

    const cancel = useMutation<void, unknown, string>({
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
