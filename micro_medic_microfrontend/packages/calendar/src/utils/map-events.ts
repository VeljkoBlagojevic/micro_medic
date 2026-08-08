import { ScheduledAppointmentDto } from "@micro-medic/shared-types";
import { CalendarEvent } from "../types";
import { parseLocalDateTime } from "./datetime";

export function toCalendarEvent(appointment: ScheduledAppointmentDto): CalendarEvent {
    const patientName = appointment.patient
    ? `${appointment.patient.firstname} ${appointment.patient.lastname}`
    : "Unknown Patient";

    return {
        id: appointment.id,
        title: patientName,
        start: parseLocalDateTime(appointment.start) || new Date(),
        end: parseLocalDateTime(appointment.end) || new Date(),
        status: appointment.status,
        resource: appointment
    };
}

export function toCalendarEvents(appointments: ScheduledAppointmentDto[]): CalendarEvent[] {
    return appointments.map(toCalendarEvent);
}