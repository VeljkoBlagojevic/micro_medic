import type { ScheduledAppointmentDto } from '@micro-medic/shared-types';
import { MmButton } from '@micro-medic/design-system-react';
import { getStatusColor, isActionable, statusLabel } from '../utils/status';
import { formatAppointmentRange } from '../utils';

interface AppointmentCardProps {
  appointment: ScheduledAppointmentDto;
  canReschedule: boolean;
  canCancel: boolean;
  onReschedule: (appointment: ScheduledAppointmentDto) => void;
  onCancel: (appointment: ScheduledAppointmentDto) => void;
  onClose: () => void;
}

export const AppointmentCard = ({
    appointment,
    canReschedule,
    canCancel,
    onReschedule,
    onCancel,
    onClose,
}: AppointmentCardProps) => {
    const actionable = isActionable(appointment.status);
    const showReschedule = actionable && canReschedule;
    const showCancel = actionable && canCancel;

    return (
      <aside className="cal-detail" aria-label={`Appointment details for ${appointment.patient?.firstname} ${appointment.patient?.lastname}`}>
        <header className="cal-detail__head">
          <span
            className="cal-detail__status"
            style={{ backgroundColor: getStatusColor(appointment.status) }}
          >
            {statusLabel(appointment.status)}
          </span>
          <button
            type="button"
            className="cal-detail__close"
            aria-label="Close appointment details"
            onClick={onClose}
          >
            &times;
          </button>
        </header>

        <dl className="cal-detail__grid">
          <dt>When</dt>
          <dd>
            {formatAppointmentRange(appointment.start, appointment.end)}
          </dd>
          <dt>Patient</dt>
          <dd>
            {appointment.patient
              ? `${appointment.patient.firstname} ${appointment.patient.lastname}`
              : 'Unknown Patient'}
          </dd>
          <dt>Doctor</dt>
          <dd>
            {appointment.doctor
              ? `${appointment.doctor.firstname} ${appointment.doctor.lastname}`
              : 'Unknown Doctor'}
          </dd>
        </dl>

        {(showReschedule || showCancel) && (
          <div className="cal-detail__actions">
            {showReschedule && (
              <MmButton variant="secondary" onClick={() => onReschedule(appointment)}>
                Reschedule
              </MmButton>
            )}
            {showCancel && (
              <MmButton variant="secondary" onClick={() => onCancel(appointment)}>
                Cancel
              </MmButton>
            )}
          </div>
        )}

        {!actionable && (
          <div className="cal-detail__info">
            <p>This appointment is {statusLabel(appointment.status)} and can no longer be changed.</p>
          </div>
        )}

      </aside>
    );
  };