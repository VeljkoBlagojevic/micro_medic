import type { DiseaseDto, UserDto } from './dtos';

/**
 * The cross-micro-frontend contract: every message any remote may publish or subscribe to.
 *
 * This is the *whole* coupling between remotes — none of them imports another, so a name added
 * here is the only way two MFEs can be made to talk. That makes the list worth keeping honest in
 * both directions: an event with no emitter is a listener nobody will ever wake, and an event with
 * no listener is a publisher shouting into a channel that has no other end. Both read as
 * integration that exists.
 *
 * | Event | Emitted by | Consumed by | Reachable? |
 * |---|---|---|---|
 * | `ICD10_DISEASE_SELECTED` | `icd10` | `examination` | yes — same screen |
 * | `CALENDAR_APPOINTMENT_SELECTED` | `calendar` | `examination` | **not today** — see below |
 * | `EXAMINATION_COMPLETED` | `examination` | `calendar` | **not today** — see below |
 * | `AUTH_LOGIN` | `shared-store` | `home` | yes — shell is never unmounted |
 * | `AUTH_LOGOUT` | `shared-store` | `home`, `examination`, `icd10`, `notifications` | yes |
 * | `NOTIFICATION_SHOW` | `auth`, `calendar`, `examination` | `notifications` | yes — always mounted |
 * | `NOTIFICATION_DISMISSED` | `notifications` | — (offered to emitters; no subscriber today) | n/a |
 *
 * ## Why the `Reachable?` column exists
 *
 * The `EventTarget` underneath has **no replay** (Geers §6.1.5), and single-spa unmounts an
 * application on every navigation away from its route — so **two MFEs on disjoint routes can never
 * hear each other**, whatever the ordering. That makes both `calendar ↔ examination` events
 * structurally undeliverable in the composed app; they fire only in the dev harnesses. Each has a
 * durable mechanism carrying the real handoff instead:
 *
 * - **`calendar` → `examination`** travels in the **URL** (`/examination?appointmentId=<id>`), which
 *   survives a reload and is re-authorized on arrival. The event is kept, narrowed to an id, and
 *   wired to the same `adoptAppointment(id)` the URL path calls, so it goes live the day one screen
 *   mounts both fragments.
 * - **`examination` → `calendar`** has no URL to ride on, so `calendar` invalidates its query on
 *   mount and treats staleness as its own problem. See `useExaminationSync`.
 *
 * The rule: **the URL for a handoff that crosses a mount boundary, the bus for coordination within
 * one screen** — decided by composition topology, not by which two MFEs are talking.
 *
 * ## Two things this bus is deliberately not
 *
 * **Not the cross-tab channel.** The two `AUTH_*` events fire for a session change made in *another*
 * tab as well as in this one — `shared-store`'s `BroadcastChannel` receives the notice and the store
 * re-emits locally. Consumers therefore need no second mechanism, and the bus stays a same-document
 * channel: nothing here crosses a tab boundary by itself.
 *
 * **Not how a fragment talks to its parent.** `nav` dropped off the `AUTH_LOGOUT` row above and is not
 * on any other: it receives the session as attributes from the shell and asks for a sign-out with a
 * bubbling `nav:sign-out` DOM event. Where one participant *contains* the other, the hierarchy already
 * carries the meaning, and a flat channel throws that away — so this bus is for fragments that are
 * siblings, which is every row in the table.
 *
 * `NOTIFICATION_DISMISSED` is a different kind of exception, and it is the inverse of the others:
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

/**
 * The id, never the `ScheduledAppointmentDto` (Geers §6.1, minimal payloads). The DTO used to travel
 * whole, nesting a patient's name and email on a channel any remote can subscribe to — and the
 * consumer rendered those fields straight from the payload, so the read never reached the backend.
 * An id forces a fetch through `AccessGuard`, which is what restores the audit trail.
 */
export interface CalendarAppointmentSelectedPayload {
    appointmentId: number;
}

/**
 * Only the id. The examination's outcome and the appointment's new `COMPLETED` status are the
 * server's answer, so `calendar` invalidates and refetches rather than patching its cache from
 * this payload — see `useExaminationSync`.
 */
export interface ExaminationCompletedPayload {
    examinationId: number;
}

/**
 * Who signed in — never the JWT. The token used to ride along here, which put a bearer credential on
 * a channel every remote can subscribe to for no reason: the only legitimate way to send an
 * authenticated request is `api-client`, which reads the token from the store itself. A subscriber
 * that has the token can bypass that, and one that stores a copy has a second session state to drift.
 */
export interface AuthLoginPayload {
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
