import { AppointmentStatus } from '@micro-medic/shared-types';

const FALLBACK_COLOR = '#6C757D'; // Gray

const STATUS_COLOR_MAP: Record<AppointmentStatus, string> = {
    [AppointmentStatus.SCHEDULED]: '#3A7BD5', // Blue
    [AppointmentStatus.COMPLETED]: '#6C757D', // Gray
    [AppointmentStatus.CANCELLED]: '#DC3545', // Red
};

// Each helper also accepts a bare string: `status` arrives off the wire, so an
// unrecognised value has to degrade gracefully rather than blow up the calendar.

export function getStatusColor(status: AppointmentStatus | string): string {
    return isValidStatus(status) ? STATUS_COLOR_MAP[status] : FALLBACK_COLOR;
}

/** Only a SCHEDULED appointment can still be rescheduled or cancelled. */
export function isActionable(status: AppointmentStatus | string): boolean {
    return status === AppointmentStatus.SCHEDULED;
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
