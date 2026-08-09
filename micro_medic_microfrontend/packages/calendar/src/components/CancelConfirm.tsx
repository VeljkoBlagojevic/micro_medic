import { ScheduledAppointmentDto } from "@micro-medic/shared-types";
import { MmButton, MmModal } from "@micro-medic/design-system-react";
import { useAppointmentMutations } from "../hooks/useAppointmentMutations";
import { useEffect, useState } from "react";
import { bookingErrorMessage, formatAppointmentRange } from "../utils";
import { ConflictBanner } from "./ConflictBanner";

interface CancelConfirmProps {
    appointment: ScheduledAppointmentDto | null;
    onClose: () => void;
}

export function CancelConfirm({ appointment, onClose }: CancelConfirmProps) {
    const { cancel } = useAppointmentMutations();
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (appointment) setError('');
    }, [appointment]);

    const confirm = async () => {
        if (!appointment) return;
        setError('');
        try {
            await cancel.mutateAsync(appointment.id);
            onClose();
        } catch (err) {
            setError(bookingErrorMessage(err));
        }
    };

    return (
        <MmModal
            open={!!appointment}
            onClose={onClose}
            heading="Confirm Cancellation"
        >
            <ConflictBanner message={error} />
            {appointment && (
                // Either party may cancel, so the copy names both rather than assuming the
                // viewer is the patient ("your appointment with Dr. X" reads wrong to a doctor).
                <p className='cal-form__hint'>
                    Cancel the appointment between{' '}
                    {appointment.patient
                        ? `${appointment.patient.firstname} ${appointment.patient.lastname}`
                        : 'an unknown patient'}
                    {' and '}
                    {appointment.doctor
                        ? `Dr. ${appointment.doctor.firstname} ${appointment.doctor.lastname}`
                        : 'an unknown doctor'}
                    {', '}
                    {formatAppointmentRange(appointment.start, appointment.end)}? This cannot be undone.
                </p>
            )}

            <div slot="footer">
                <MmButton variant="secondary" onClick={onClose}>
                    Keep Appointment
                </MmButton>
                <MmButton variant="danger" loading={cancel.isPending} onClick={confirm}>
                    Cancel Appointment
                </MmButton>
            </div>
        </MmModal>
    );
}
