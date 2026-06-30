package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import java.util.List;

public record TherapyDto(
        Long id,
        String instructions,
        List<MedicineUsageDto> medicineUsages
) {
}
