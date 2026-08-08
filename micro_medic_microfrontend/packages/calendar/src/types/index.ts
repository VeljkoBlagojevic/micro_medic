import type { AppointmentStatus, ScheduledAppointmentDto } from '@micro-medic/shared-types';

export type CalendarViewKind = 'day' | 'week' | 'month';

export interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    status: AppointmentStatus;
    /** The DTO the event was built from, so a click can open the detail pane. */
    resource: ScheduledAppointmentDto;
}

export interface PatientOption {
    id: number;
    label: string;
    sublabel: string;
}

// `BookingFormValues` / `RescheduleFormValues` used to live here with `start: Date`, but the
// forms are driven by `z.infer<>` from `schemas.ts` and work in `yyyy-MM-ddTHH:mm` strings.
// Two competing definitions of the same shape is how they drifted, so the zod types are now
// the only source.
