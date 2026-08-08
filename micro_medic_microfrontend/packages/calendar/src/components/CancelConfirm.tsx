import { ScheduledAppointmentDto } from "@micro-medic/shared-types";
import { useAppointmentMutations } from "../hooks/useAppointmentMutations";
import { useEffect, useState } from "react";
import { bookingErrorMessage } from "../utils";
import { MmModal } from "./MmModal";
import { MmButton } from "./MmButton";
import { ConflictBanner } from "./ConflictBanner";

interface CancelConfirmProps {
    appointment: ScheduledAppointmentDto;
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
            title="Confirm Cancellation"
            footer={
                <div className="flex justify-end space-x-2">
                    <MmButton variant="secondary" onClick={onClose}>
                        Keep Appointment
                    </MmButton>
                    <MmButton variant="danger" onClick={confirm}>
                        Cancel Appointment
                    </MmButton>
                </div>
            }
        >

            <ConflictBanner message={error} />
            {appointment && (
                <p className='cal-confirm-text'>
                    Are you sure you want to cancel your appointment with Dr. {String(appointment.doctor)} on {new Date(appointment.start).toLocaleString()}?
                </p>
            )}
        </MmModal>
    );
}
            