import type { MedicineDto, MedicineUsageRequest } from '@micro-medic/shared-types';

/**
 * One prescribed medicine, as the form holds it before submission.
 *
 * This is deliberately *not* `MedicineUsageRequest`. That request carries only `medicineId`, but
 * the table has to show the doctor a name and a form, and re-fetching the medicine to render a row
 * the doctor just picked would be absurd. So the draft keeps the whole `MedicineDto` and
 * `toMedicineUsageRequest` narrows it at the boundary — the wire format is derived from the view
 * model, never the other way round.
 */
export interface PrescriptionDraft {
    /**
     * Client-side identity, so the table has a stable `rowKey` before anything is persisted.
     * The medicine id will not do: the same medicine can legitimately be prescribed twice with
     * different methods, and two rows sharing a key make Lit's keyed rendering reuse the wrong one.
     */
    readonly draftId: string;
    readonly medicine: MedicineDto;
    /** Free text — "1 tablet with food". Maps to `MedicineUsage.methodUse` (`@NotBlank`). */
    readonly methodUse: string;
    /** Maps to `MedicineUsage.frequencyIntakeInHours` (`@NotNull @PositiveOrZero`). */
    readonly frequencyInHours: number;
}

let draftCounter = 0;

/**
 * Mints a draft id. A counter rather than `crypto.randomUUID()`: uniqueness is only needed within
 * one form instance, and a short readable id is easier to follow in the DOM while debugging.
 */
export function nextDraftId(): string {
    return `rx-${++draftCounter}`;
}

/** Display label for a medicine: brand name if it has one, otherwise the generic. */
export function medicineLabel(medicine: MedicineDto): string {
    const brand = medicine.brandName?.trim();
    const generic = medicine.genericName?.trim();

    if (brand && generic && brand !== generic) return `${brand} (${generic})`;
    return brand || generic || `Medicine #${medicine.id}`;
}

/** Human phrasing for a dosing interval. `24` reads better as "once daily" than "every 24 h". */
export function formatFrequency(hours: number): string {
    if (hours === 24) return 'Once daily';
    if (hours === 12) return 'Twice daily';
    if (hours === 8) return 'Three times daily';
    if (hours === 6) return 'Four times daily';
    if (hours === 0) return 'As needed';
    return `Every ${hours} h`;
}

/** Narrows a draft to the wire format `ExaminationRequest.medicineUsages` expects. */
export function toMedicineUsageRequest(draft: PrescriptionDraft): MedicineUsageRequest {
    return {
        medicineId: draft.medicine.id,
        methodUse: draft.methodUse.trim(),
        // Note the rename: the request field is `usageFrequencyInHours` while the response DTO
        // calls the same value `frequencyIntakeInHours`. This is the only place that matters.
        usageFrequencyInHours: draft.frequencyInHours,
    };
}
