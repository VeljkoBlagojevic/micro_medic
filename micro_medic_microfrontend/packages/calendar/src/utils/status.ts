import { AppointmentStatus } from '@micro-medic/shared-types';

/*
 * Status colours resolve through the shared `--mm-color-status-*` tokens rather than literal
 * hex, so an appointment is the same colour in every micro-frontend that renders one. The
 * fallback after the comma keeps these usable if the host never loaded `tokens.css`.
 *
 * These are returned as `var(...)` strings for inline `style`, which is the one place a token
 * can be used without a stylesheet — the values feed react-big-calendar's `eventPropGetter`
 * and the detail-pane badge, both of which take a style object.
 */
const FALLBACK_COLOR = 'var(--mm-color-status-completed, #6c757d)';

const STATUS_COLOR_MAP: Record<AppointmentStatus, string> = {
    [AppointmentStatus.SCHEDULED]: 'var(--mm-color-status-scheduled, #3a7bd5)',
    [AppointmentStatus.COMPLETED]: 'var(--mm-color-status-completed, #6c757d)',
    [AppointmentStatus.CANCELLED]: 'var(--mm-color-status-cancelled, #dc3545)',
};

// Each helper also accepts a bare string: `status` arrives off the wire, so an
// unrecognised value has to degrade gracefully rather than blow up the calendar.

export function getStatusColor(status: AppointmentStatus | string): string {
    return isValidStatus(status) ? STATUS_COLOR_MAP[status] : FALLBACK_COLOR;
}

/**
 * Only a SCHEDULED appointment can still be rescheduled or cancelled.
 *
 * Narrows through `isValidStatus` rather than comparing the parameter to the enum member
 * directly: `status` is typed `AppointmentStatus | string`, and comparing a bare `string` to an
 * enum member is exactly the unsound comparison that would keep passing if the enum's value
 * were ever changed away from its own name.
 */
export function isActionable(status: AppointmentStatus | string): boolean {
    return isValidStatus(status) && status === AppointmentStatus.SCHEDULED;
}

/** `"SCHEDULED"` -> `"Scheduled"`. Unknown values pass through untouched. */
export function statusLabel(status: AppointmentStatus | string): string {
    if (!status) return '';
    if (!isValidStatus(status)) return status;
    return status.charAt(0) + status.slice(1).toLowerCase();
}

function isValidStatus(status: AppointmentStatus | string): status is AppointmentStatus {
    return (Object.values(AppointmentStatus) as string[]).includes(status);
}
