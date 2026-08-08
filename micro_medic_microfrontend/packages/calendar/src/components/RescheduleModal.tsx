import { zodResolver } from "@hookform/resolvers/zod";
import { ScheduledAppointmentDto } from "@micro-medic/shared-types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppointmentMutations } from "../hooks/useAppointmentMutations";
import { RescheduleSchema, rescheduleSchema } from "../schemas";
import { parseLocalDateTime } from "../utils";
import { MmModal } from "./MmModal";
import { MmButton } from "./MmButton";
import { ConflictBanner } from "./ConflictBanner";
import { MmField } from "./MmField";

interface RescheduleModalProps {
    appointment: ScheduledAppointmentDto | null;
    onClose: () => void;
}

export function RescheduleModal({ appointment, onClose }: RescheduleModalProps) {
    const { reschedule } = useAppointmentMutations();
    const [ conflictError, setConflictError ] = useState<string>('');

    const { control, handleSubmit, reset } = useForm<RescheduleSchema>({
        resolver: zodResolver(rescheduleSchema),
        defaultValues: {
            start: '',
            end: '',
        },
    });

    useEffect(() => {
        if (appointment) {
            reset({
                start: String(parseLocalDateTime(appointment.start)),
                end: String(parseLocalDateTime(appointment.end)),
            });
            setConflictError('');
        }
    }, [appointment, reset]);

    const submit = handleSubmit(async (data) => {
        if (!appointment) return;
        setConflictError('');
        try {
            await reschedule.mutateAsync({
                appointmentId: appointment.id,
                rescheduleRequest: {
                    patientId: appointment.patient.id,
                    start: data.start,
                    end: data.end,
                },
            });
            onClose();
        } catch (err) {
            setConflictError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        }
    });

    return (
        <MmModal
            open={!!appointment}
            onClose={onClose}
            title="Reschedule Appointment"
            footer={
                <div className="flex justify-end space-x-2">
                    <MmButton variant="secondary" onClick={onClose}>
                        Cancel
                    </MmButton>
                    <MmButton variant="primary" onClick={submit}>
                        Reschedule
                    </MmButton>
                </div>
            }
        >
            <form
                onSubmit={submit}
                className="flex flex-col space-y-4"
            >
                <ConflictBanner message={conflictError} />
                {appointment && (
                    <p className='cal-confirm-text'>
                        Rescheduling your appointment with Dr. {String(appointment.doctor)} on {new Date(appointment.start).toLocaleString()}.
                    </p>
                )}
                <div className="flex flex-col space-y-2">
                    <MmField
                        name="start"
                        control={control}
                        label="New Start Time"
                        type="datetime-local"
                    />
                    <MmField
                        name="end"
                        control={control}
                        label="New End Time"
                        type="datetime-local"
                    />
                </div>
            </form>
        </MmModal>
    );
}
