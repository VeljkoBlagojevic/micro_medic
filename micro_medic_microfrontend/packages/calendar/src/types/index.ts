import type { ScheduledAppointmentDto } from '@micro-medic/shared-types';

export type CalendarViewKind = 'day' | 'week' | 'month';

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    status: string;
    resource: ScheduledAppointmentDto;
}

export interface BookingFormValues {
    patientId: number | null;
    start: Date;
    end: Date;
}

export interface RescheduleFormValues {
    start: Date;
    end: Date;
}

export interface PatientOption {
    id: number;
    label: string;
    sublabel: string;
}