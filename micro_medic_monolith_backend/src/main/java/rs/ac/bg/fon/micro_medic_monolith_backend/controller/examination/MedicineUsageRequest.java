package rs.ac.bg.fon.micro_medic_monolith_backend.controller.examination;

public record MedicineUsageRequest(String methodUse, int usageFrequencyInHours, String medicineId) { }
