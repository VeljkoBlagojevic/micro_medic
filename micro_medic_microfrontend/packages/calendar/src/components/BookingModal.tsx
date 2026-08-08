import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppointmentMutations } from "../hooks/useAppointmentMutations";
import { MmModal } from "./MmModal";
import { MmButton } from "./MmButton";
import { ConflictBanner } from "./ConflictBanner";
import { useForm } from "react-hook-form";
import { MmField } from "./MmField";
import { PatientSearchField } from "./PatientSearchField";
import type { PatientOption } from "../types";
import { BookingSchema, bookingSchema } from "../schemas";
import { dateTimeLocalToLocalDate, defaultBookingWindow } from "../utils";


interface BookingModalProps {
    open: boolean;
    onClose: () => void;
}

export function BookingModal({ open, onClose }: BookingModalProps) {
    const { book } = useAppointmentMutations();
    const [patient, setPatient] = useState<PatientOption | null>(null);
    const [conflict, setConflict] = useState('');

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<BookingSchema>({
        resolver: zodResolver(bookingSchema),
        defaultValues: { patientId: undefined, start: undefined, end: undefined },
    });

    // seed sensible default times + clear state whenever the modal opens
    useEffect(() => {
        if (open) {
            const { start, end } = defaultBookingWindow();
            reset({ patientId: undefined, start, end });
            setPatient(null);
            setConflict('');
        }
    }, [open, reset]);

    const onSelectPatient = (nextPatient: PatientOption | null) => {
        setPatient(nextPatient);
        if (nextPatient?.id) {
            setValue('patientId', nextPatient.id, { shouldValidate: true });
        }
    }

    const submit = handleSubmit(async (data) => {
        try {
            await book.mutateAsync({
                patientId: data.patientId!,
                start: dateTimeLocalToLocalDate(data.start!),
                end: dateTimeLocalToLocalDate(data.end!),
            });
            onClose();
        } catch (error: any) {
            setConflict(error?.response?.data?.message || 'An error occurred while booking the appointment.');
        }
    });

    return (
        <MmModal
            open={open}
            heading="Book Appointment"
            onClose={onClose}
            footer={
                <>
                    <MmButton variant="secondary" onClick={onClose}>Cancel</MmButton>
                    <MmButton variant="primary" onClick={submit}>Book</MmButton>
                </>
            }
        >
            <form onSubmit={submit}>

                <ConflictBanner message={conflict} />

                <PatientSearchField
                    selected={patient}
                    onSelect={onSelectPatient}
                    error={errors.patientId?.message}
                />
                <div className="form-group">
                    <MmField control={control} name="start" label="Start Time" type="datetime-local" />
                </div>
                <div className="form-group">
                    <MmField control={control} name="end" label="End Time" type="datetime-local" />
                </div>
            </form>
        </MmModal>
    );
}