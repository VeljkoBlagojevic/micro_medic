import { AppointmentStatus } from '@micro-medic/shared-types';

const STATUS_COLOR_MAP: Record<AppointmentStatus, string> = {
    [AppointmentStatus.SCHEDULED]: '#3A7BD5', // Blue
    [AppointmentStatus.COMPLETED]: '#6C757D', // Gray
    [AppointmentStatus.CANCELLED]: '#DC3545', // Red
};

export function getStatusColor(status: AppointmentStatus | string): string {
    if (typeof status === 'string') {
        if (!isValidStatus(status)) {
            return '#6C757D'; // Default to gray if status is unknown
        }
    }

    return STATUS_COLOR_MAP[status as AppointmentStatus] || '#6C757D'; // Default to gray if status is unknown
}

export function isActionable(status: AppointmentStatus | string): boolean {
    if (typeof status === 'string') {
        if (!isValidStatus(status)) {
            return false;
        }
        status = status as AppointmentStatus;
    }
    return status === AppointmentStatus.SCHEDULED;
}

export function statusLabel(status: AppointmentStatus | string): string {
    if (!status) {
        return '';
    }
    if (typeof status === 'string') {
        if (!isValidStatus(status)) {
            return status;
        }
        status = status as AppointmentStatus;
    }
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function isValidStatus(status: string): status is AppointmentStatus {
    return Object.values(AppointmentStatus).includes(status as AppointmentStatus);
}