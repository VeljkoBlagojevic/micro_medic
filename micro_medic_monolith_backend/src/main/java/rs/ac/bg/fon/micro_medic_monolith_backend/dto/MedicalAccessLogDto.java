package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import java.time.LocalDateTime;

public record MedicalAccessLogDto(
        Long id,
        Long accessorId,
        String accessorRole,
        String resourceType,
        Long resourceId,
        Long patientId,
        LocalDateTime accessedAt
) {
}
