import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MmButton, MmModal } from "@micro-medic/design-system-react";
import { useAppointmentMutations } from "../hooks/useAppointmentMutations";
import { ConflictBanner } from "./ConflictBanner";
import { MmFormField } from "./MmFormField";
import { PatientSearchField } from "./PatientSearchField";
import type { PatientOption } from "../types";
import { type BookingSchema, bookingSchema } from "../schemas";
import { bookingErrorMessage, dateTimeLocalToLocalDate, defaultBookingWindow } from "../utils";

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
        defaultValues: { patientId: undefined, start: '', end: '' },
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
        // `undefined` (not `null`) clears the field, so zod reports "required" rather than
        // "expected number, received null".
        setValue('patientId', nextPatient?.id as BookingSchema['patientId'], {
            shouldValidate: !!nextPatient,
        });
    };

    const submit = handleSubmit(async (data) => {
        setConflict('');
        try {
            await book.mutateAsync({
                patientId: data.patientId,
                start: dateTimeLocalToLocalDate(data.start),
                end: dateTimeLocalToLocalDate(data.end),
            });
            onClose();
        } catch (error) {
            // The api-client interceptor turns every failure into an `ApiError`, so
            // `error.response.data.message` is always undefined — `bookingErrorMessage`
            // reads the normalised shape.
            setConflict(bookingErrorMessage(error));
        }
    });

    return (
        <MmModal
            open={open}
            heading="Book Appointment"
            onClose={onClose}
        >
            <form onSubmit={submit} className="cal-form">
                <ConflictBanner message={conflict} />

                <PatientSearchField
                    selected={patient}
                    onSelect={onSelectPatient}
                    error={errors.patientId?.message}
                />
                <MmFormField control={control} name="start" label="Start Time" type="datetime-local" required />
                <MmFormField control={control} name="end" label="End Time" type="datetime-local" required />
            </form>

            <div slot="footer">
                <MmButton variant="secondary" onClick={onClose}>Cancel</MmButton>
                <MmButton variant="primary" loading={book.isPending} onClick={submit}>Book</MmButton>
            </div>
        </MmModal>
    );
}
