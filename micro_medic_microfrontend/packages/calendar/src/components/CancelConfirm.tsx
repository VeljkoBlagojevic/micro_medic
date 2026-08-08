import { ScheduledAppointmentDto } from "@micro-medic/shared-types";
import { MmButton, MmModal } from "@micro-medic/design-system-react";
import { useAppointmentMutations } from "../hooks/useAppointmentMutations";
import { useEffect, useState } from "react";
import { bookingErrorMessage } from "../utils";
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
                <p className='cal-form__hint'>
                    Are you sure you want to cancel your appointment with Dr. {appointment.doctor?.lastname ?? 'Unknown'} on {new Date(appointment.start).toLocaleString()}?
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
