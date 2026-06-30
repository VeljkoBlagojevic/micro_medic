package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

public record MedicineDto(
        Long id,
        String genericName,
        String brandName,
        String form
) {
}
