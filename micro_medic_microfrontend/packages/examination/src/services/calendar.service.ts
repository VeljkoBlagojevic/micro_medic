import { createService } from '@micro-medic/api-client';
import type { Page, ScheduledAppointmentDto } from '@micro-medic/shared-types';

const calendarApi = createService('api/calendar');

/**
 * The slice of `controller/CalendarController` this MFE needs.
 *
 * Duplicating two methods of `calendar`'s own service is deliberate, and is the trade
 * micro-frontends make on purpose: importing `calendar/src/services/calendar.service` would
 * couple two independently deployed remotes at build time, so neither could be released without
 * the other. The shared contract is `@micro-medic/shared-types` — the DTO shapes — not the client
 * code that fetches them.
 */
export const calendarService = {
    /**
     * `GET /api/calendar` — already scoped to the caller by `CalendarService.getCalendar`, so a
     * doctor gets their own appointments and no id is needed.
     *
     * Used to populate the appointment picker for the case where the doctor opens
     * `/examination` directly instead of arriving from a calendar selection.
     */
    list(params?: {
        page?: number;
        size?: number;
        sort?: string;
    }): Promise<Page<ScheduledAppointmentDto>> {
        return calendarApi.get<Page<ScheduledAppointmentDto>>('', params);
    },

    getById(appointmentId: number): Promise<ScheduledAppointmentDto> {
        return calendarApi.get<ScheduledAppointmentDto>(`/${appointmentId}`);
    },
};
