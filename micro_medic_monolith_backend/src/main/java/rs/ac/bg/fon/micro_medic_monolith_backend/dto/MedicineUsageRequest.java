package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

public record MedicineUsageRequest(
        String methodUse,
        int usageFrequencyInHours,
        Long medicineId
) {
}
