import { createService } from '@micro-medic/api-client';
import type {
    ScheduledAppointmentDto,
    AppointmentRequest,
    Page
} from '@micro-medic/shared-types';

const calendarApi = createService('api/calendar');

/** Mirrors `controller/CalendarController`. */
export const calendarService = {
    /**
     * `GET /api/calendar` — the backend scopes this to the caller (their own
     * appointments as patient or as doctor), so no id is needed.
     */
    list(params?: { page?: number; size?: number; sort?: string }): Promise<Page<ScheduledAppointmentDto>> {
        return calendarApi.get<Page<ScheduledAppointmentDto>>('', params);
    },

    book(appointment: AppointmentRequest): Promise<ScheduledAppointmentDto> {
        return calendarApi.post<ScheduledAppointmentDto>('', appointment);
    },

    /**
     * The backend reads only `start` / `end` here, but the body is still validated as a
     * full `AppointmentRequest`, so `patientId` must be present and non-null.
     */
    reschedule(appointmentId: number, rescheduleRequest: AppointmentRequest): Promise<ScheduledAppointmentDto> {
        return calendarApi.put<ScheduledAppointmentDto>(`/${appointmentId}/reschedule`, rescheduleRequest);
    },

    /** Returns the updated appointment, not `void`. */
    cancel(appointmentId: number): Promise<ScheduledAppointmentDto> {
        return calendarApi.put<ScheduledAppointmentDto>(`/${appointmentId}/cancel`);
    }
};
