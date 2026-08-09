import { Role, type ScheduledAppointmentDto } from "@micro-medic/shared-types";
import { CalendarEvent } from "../types";
import { parseLocalDateTime } from "./datetime";

/**
 * Name of the *other* party on an appointment, from the viewer's perspective.
 *
 * Titling every event with the patient's name is wrong for half the users: a patient looking at
 * their own calendar would see their own name on every entry. `GET /api/calendar` is scoped to
 * the caller and returns appointments where they are either the patient or the doctor, so the
 * useful label is always the counterpart.
 */
export function counterpartName(
    appointment: ScheduledAppointmentDto,
    viewerRole: Role | null
): string {
    // A patient (or any non-doctor viewer) is looking at their doctors; anyone else — a doctor
    // viewing their own schedule, or an admin — is looking at patients.
    if (viewerRole === Role.PATIENT) {
        return appointment.doctor
            ? `Dr. ${appointment.doctor.firstname} ${appointment.doctor.lastname}`
            : 'Unknown doctor';
    }
    return appointment.patient
        ? `${appointment.patient.firstname} ${appointment.patient.lastname}`
        : 'Unknown patient';
}

export function toCalendarEvent(
    appointment: ScheduledAppointmentDto,
    viewerRole: Role | null
): CalendarEvent {
    // `start`/`end` are `LocalDateTime` strings and should always parse. Falling back to *now*
    // silently relocates a broken appointment onto today's grid, so fall back to the epoch
    // instead: it is visibly wrong rather than plausibly wrong.
    const start = parseLocalDateTime(appointment.start);
    const end = parseLocalDateTime(appointment.end);

    return {
        id: appointment.id,
        title: counterpartName(appointment, viewerRole),
        start: start ?? new Date(0),
        end: end ?? start ?? new Date(0),
        status: appointment.status,
        resource: appointment
    };
}

export function toCalendarEvents(
    appointments: ScheduledAppointmentDto[],
    viewerRole: Role | null
): CalendarEvent[] {
    return appointments.map((appointment) => toCalendarEvent(appointment, viewerRole));
}
