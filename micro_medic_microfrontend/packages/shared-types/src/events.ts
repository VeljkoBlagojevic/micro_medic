import type { DiseaseDto, MedicineDto, ScheduledAppointmentDto, UserDto } from './dtos';

export const EventTypes = {
    ICD10_DISEASE_SELECTED: 'ICD10_DISEASE_SELECTED',

    CALENDAR_APPOINTMENT_SELECTED: 'CALENDAR_APPOINTMENT_SELECTED',

    EXAMINATION_COMPLETED: 'EXAMINATION_COMPLETED',

    PHARMACY_MEDICINE_SELECTED: 'PHARMACY_MEDICINE_SELECTED',

    AUTH_LOGIN: 'AUTH_LOGIN',
    AUTH_LOGOUT: 'AUTH_LOGOUT',
    AUTH_TOKEN_REFRESHED: 'AUTH_TOKEN_REFRESHED',

    NOTIFICATION_SHOW: 'NOTIFICATION_SHOW',
    NOTIFICATION_DISMISSED: 'NOTIFICATION_DISMISSED'

} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

export interface DiseaseSelectedPayload {
    disease: DiseaseDto;
}

export interface CalendarAppointmentSelectedPayload {
    appointment: ScheduledAppointmentDto;
}

export interface ExaminationCompletedPayload {
    examinationId: number;
}

export interface PharmacyMedicineSelectedPayload {
    medicine: MedicineDto;
}

export interface AuthLoginPayload {
    token: string;
    user: UserDto;
}

export interface NotificationPayload {
    /** Optional: the emitter usually has no meaningful id, so let the consumer generate one. */
    id?: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

export interface EventPayloadMap {
    [EventTypes.ICD10_DISEASE_SELECTED]: DiseaseSelectedPayload;
    [EventTypes.CALENDAR_APPOINTMENT_SELECTED]: CalendarAppointmentSelectedPayload;
    [EventTypes.EXAMINATION_COMPLETED]: ExaminationCompletedPayload;
    [EventTypes.PHARMACY_MEDICINE_SELECTED]: PharmacyMedicineSelectedPayload;
    [EventTypes.AUTH_LOGIN]: AuthLoginPayload;
    [EventTypes.AUTH_LOGOUT]: void;
    [EventTypes.AUTH_TOKEN_REFRESHED]: void;
    [EventTypes.NOTIFICATION_SHOW]: NotificationPayload;
    [EventTypes.NOTIFICATION_DISMISSED]: { id: string };
}
