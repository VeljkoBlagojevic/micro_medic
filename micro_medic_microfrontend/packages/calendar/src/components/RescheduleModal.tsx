import { zodResolver } from "@hookform/resolvers/zod";
import { ScheduledAppointmentDto } from "@micro-medic/shared-types";
import { MmButton, MmModal } from "@micro-medic/design-system-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppointmentMutations } from "../hooks/useAppointmentMutations";
import { RescheduleSchema, rescheduleSchema } from "../schemas";
import {
    bookingErrorMessage,
    dateTimeLocalToLocalDateTime,
    dateTimeLocalToLocalDate,
    parseLocalDateTime,
} from "../utils";
import { ConflictBanner } from "./ConflictBanner";
import { MmFormField } from "./MmFormField";

interface RescheduleModalProps {
    appointment: ScheduledAppointmentDto | null;
    onClose: () => void;
}

export function RescheduleModal({ appointment, onClose }: RescheduleModalProps) {
    const { reschedule } = useAppointmentMutations();
    const [conflictError, setConflictError] = useState<string>('');

    const { control, handleSubmit, reset } = useForm<RescheduleSchema>({
        resolver: zodResolver(rescheduleSchema),
        defaultValues: {
            start: '',
            end: '',
        },
    });

    useEffect(() => {
        if (appointment) {
            const start = parseLocalDateTime(appointment.start);
            const end = parseLocalDateTime(appointment.end);
            // A `datetime-local` input only accepts `yyyy-MM-ddTHH:mm`; `String(date)`
            // would yield "Mon Aug 08 2026 ..." and the field would render empty.
            reset({
                start: start ? dateTimeLocalToLocalDateTime(start) : '',
                end: end ? dateTimeLocalToLocalDateTime(end) : '',
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
                    // Ignored by the reschedule endpoint, but `AppointmentRequest` is
                    // still bean-validated, and `patientId` is `@NotNull`.
                    patientId: appointment.patient.id,
                    start: dateTimeLocalToLocalDate(data.start),
                    end: dateTimeLocalToLocalDate(data.end),
                },
            });
            onClose();
        } catch (err) {
            setConflictError(bookingErrorMessage(err));
        }
    });

    return (
        <MmModal
            open={!!appointment}
            onClose={onClose}
            heading="Reschedule Appointment"
        >
            <form onSubmit={submit} className="cal-form">
                <ConflictBanner message={conflictError} />
                {appointment && (
                    <p className='cal-form__hint'>
                        Rescheduling your appointment with Dr. {appointment.doctor?.lastname ?? 'Unknown'} on {new Date(appointment.start).toLocaleString()}.
                    </p>
                )}
                <MmFormField control={control} name="start" label="New Start Time" type="datetime-local" required />
                <MmFormField control={control} name="end" label="New End Time" type="datetime-local" required />
            </form>

            <div slot="footer">
                <MmButton variant="secondary" onClick={onClose}>
                    Cancel
                </MmButton>
                <MmButton variant="primary" loading={reschedule.isPending} onClick={submit}>
                    Reschedule
                </MmButton>
            </div>
        </MmModal>
    );
}
