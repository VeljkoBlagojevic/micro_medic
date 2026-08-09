import { format, parseISO, isValid } from 'date-fns';

export function parseLocalDateTime(dateString: string): Date | null {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
}

export function dateTimeLocalToLocalDateTime(date: Date): string {
    return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function dateTimeLocalToLocalDate(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
}

export function formatAppointmentRange(startIso: string, endIso: string): string {
    const start = parseLocalDateTime(startIso);
    const end = parseLocalDateTime(endIso);
    return start && end ? `${format(start, 'MMM d, yyyy h:mm a')} - ${format(end, 'h:mm a')}` : '';
}

export function formatTimeRange(start: Date, end: Date): string {
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
}

export function defaultBookingWindow(base: Date = new Date()): { start: string; end: string } {
    const start = new Date(base);
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    return {
        start: dateTimeLocalToLocalDateTime(start),
        end: dateTimeLocalToLocalDateTime(end),
    };
}