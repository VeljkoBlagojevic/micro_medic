import type { DiseaseDto, ScheduledAppointmentDto, UserDto } from './dtos';

/**
 * The cross-micro-frontend contract: every message any remote may publish or subscribe to.
 *
 * This is the *whole* coupling between remotes — none of them imports another, so a name added
 * here is the only way two MFEs can be made to talk. That makes the list worth keeping honest in
 * both directions: an event with no emitter is a listener nobody will ever wake, and an event with
 * no listener is a publisher shouting into a channel that has no other end. Both read as
 * integration that exists.
 *
 * Every entry below has at least one emitter and one listener today:
 *
 * | Event | Emitted by | Consumed by |
 * |---|---|---|
 * | `ICD10_DISEASE_SELECTED` | `icd10` | `examination` |
 * | `CALENDAR_APPOINTMENT_SELECTED` | `calendar` | `examination` |
 * | `EXAMINATION_COMPLETED` | `examination` | `calendar` |
 * | `AUTH_LOGIN` / `AUTH_LOGOUT` | `shared-store` | `home`, `examination`, `icd10`, `nav`, `notifications` |
 * | `NOTIFICATION_SHOW` | `auth`, `calendar`, `examination` | `notifications` |
 * | `NOTIFICATION_DISMISSED` | `notifications` | — (offered to emitters; no subscriber today) |
 *
 * `NOTIFICATION_DISMISSED` is the one deliberate exception, and it is the inverse of the others:
 * it is the reply half of a request the `notifications` MFE receives, so its subscriber is
 * whichever emitter wants to know its toast was seen. Dropping it would mean an emitter *could
 * not* find out.
 *
 * Two names were removed after an audit found neither end: `PHARMACY_MEDICINE_SELECTED` (there is
 * no `pharmacy` package — `examination` searches the medicine catalogue in-process through
 * `medicine.service.ts`) and `AUTH_TOKEN_REFRESHED` (the backend issues one JWT and has no refresh
 * endpoint; the strategy is the api-client's `onUnauthorized` → `authStore.logout()`). Add either
 * back in the same change that adds the MFE or the endpoint, not before.
 */
export const EventTypes = {
    ICD10_DISEASE_SELECTED: 'ICD10_DISEASE_SELECTED',

    CALENDAR_APPOINTMENT_SELECTED: 'CALENDAR_APPOINTMENT_SELECTED',

    EXAMINATION_COMPLETED: 'EXAMINATION_COMPLETED',

    AUTH_LOGIN: 'AUTH_LOGIN',
    AUTH_LOGOUT: 'AUTH_LOGOUT',

    NOTIFICATION_SHOW: 'NOTIFICATION_SHOW',
    NOTIFICATION_DISMISSED: 'NOTIFICATION_DISMISSED'

} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

/**
 * Note what is absent: there is no `disease: DiseaseDto | null`. `icd10` publishes a selection and
 * never a deselection, so each side owns its own Clear button — an asymmetry the two READMEs
 * document rather than paper over.
 */
export interface DiseaseSelectedPayload {
    disease: DiseaseDto;
}

export interface CalendarAppointmentSelectedPayload {
    appointment: ScheduledAppointmentDto;
}

/**
 * Only the id. The examination's outcome and the appointment's new `COMPLETED` status are the
 * server's answer, so `calendar` invalidates and refetches rather than patching its cache from
 * this payload — see `useExaminationSync`.
 */
export interface ExaminationCompletedPayload {
    examinationId: number;
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
    [EventTypes.AUTH_LOGIN]: AuthLoginPayload;
    [EventTypes.AUTH_LOGOUT]: void;
    [EventTypes.NOTIFICATION_SHOW]: NotificationPayload;
    [EventTypes.NOTIFICATION_DISMISSED]: { id: string };
}
