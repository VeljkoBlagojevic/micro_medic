package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

public record MedicineUsageDto(
        Long id,
        String methodUse,
        Integer frequencyIntakeInHours,
        MedicineDto medicine
) {
}
