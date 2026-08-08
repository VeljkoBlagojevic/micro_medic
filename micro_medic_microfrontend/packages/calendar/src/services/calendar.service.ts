import { createService } from '@micro-medic/api-client';
import type {
    ScheduledAppointmentDto,
    AppointmentRequest,
    Page
} from '@micro-medic/shared-types';

const calendarApi = createService('api/calendar');

export const calendarService = {
    list(): Promise<Page<ScheduledAppointmentDto>> {
        return calendarApi.get<Page<ScheduledAppointmentDto>>('/');
    },

    book(appointment: AppointmentRequest): Promise<ScheduledAppointmentDto> {
        return calendarApi.post<ScheduledAppointmentDto>('/', appointment);
    },

    reschedule(appointmentId: string, rescheduleRequest: AppointmentRequest): Promise<ScheduledAppointmentDto> {
        return calendarApi.put<ScheduledAppointmentDto>(`/${appointmentId}/reschedule`, rescheduleRequest);
    },

    cancel(appointmentId: string): Promise<void> {
        return calendarApi.put<void>(`/${appointmentId}/cancel`, {});
    }
};