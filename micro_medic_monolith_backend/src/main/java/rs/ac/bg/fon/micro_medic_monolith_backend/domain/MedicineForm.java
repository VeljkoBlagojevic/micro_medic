package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.validation.constraints.NotBlank;

public enum MedicineForm {

    TABLET("Tablet"),
    INJECTIBLE("Injectible"),
    SUPPOSITORY("Suppository"),
    SOLUTION("Solution"),
    APPLICATION("Application"),
    EYE_OINTMENT("Eye Ointment"),
    CAPSULE("Capsule"),
    DROP("Drop"),
    SYRUP("Syrup"),
    VACCINE("Vaccine"),
    PATCH("Patch"),
    ORAL_SUSPENSION("Oral Suspension"),
    NASAL_SPRAY("Nasal Spray"),
    OINTMENT("Ointment"),
    SUSPENSION("Suspension"),
    INHALER("Inhaler"),
    LOTION("Lotion"),
    POWDER("Powder");

    @NotBlank(message = "Name can't be blank")
    private String name;

    MedicineForm(String name) {
        this.name = name;
    }

    @JsonValue
    public String getName() {
        return name;
    }
}
