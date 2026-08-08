package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Dosage forms. The constants cover every {@code form} value present in
 * {@code medicines.json}; {@link rs.ac.bg.fon.micro_medic_monolith_backend.repository.MedicineFormConverter}
 * rejects anything else, so a new form in the reference data must be added here first.
 */
public enum MedicineForm {
    TABLET("Tablet"),
    CAPSULE("Capsule"),
    INJECTIBLE("Injectible"),
    APPLICATION("Application"),
    ORAL_SUSPENSION("Oral Suspension"),
    SUSPENSION("Suspension"),
    SOLUTION("Solution"),
    SYRUP("Syrup"),
    DROP("Drop"),
    INHALER("Inhaler"),
    OINTMENT("Ointment"),
    EYE_OINTMENT("Eye Ointment"),
    SUPPOSITORY("Suppository"),
    NASAL_SPRAY("Nasal Spray"),
    VACCINE("Vaccine"),
    LOTION("Lotion"),
    POWDER("Powder"),
    PATCH("Patch");

    private final String name;

    MedicineForm(String name) {
        this.name = name;
    }

    @JsonValue
    public String getName() {
        return this.name;
    }
}
