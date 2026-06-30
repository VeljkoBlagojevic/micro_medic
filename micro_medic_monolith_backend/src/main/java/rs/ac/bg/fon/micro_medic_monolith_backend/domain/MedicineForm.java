package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.validation.constraints.NotBlank;

public enum MedicineForm {
    TABLET("Tablet"),
    INJECTIBLE("Injectible");

    // more

    @NotBlank
    private String name;

    MedicineForm(String name) {
        this.name = name;
    }

    @JsonValue
    public String getName() {
        return this.name;
    }
}
