package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.MedicineForm;

@Converter(autoApply = true)
public class MedicineFormConverter implements AttributeConverter<MedicineForm, String> {
    @Override
    public String convertToDatabaseColumn(MedicineForm form) {
        if (form == null) {
            return null;
        }
        return form.getName();

    }

    @Override
    public MedicineForm convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;

        for (MedicineForm form : MedicineForm.values()) {
            if (form.getName().equals(dbData)) {
                return form;
            }
        }
        throw new IllegalArgumentException("Unknown value: " + dbData);
    }
}
