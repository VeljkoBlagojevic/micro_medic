package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth.UserDto;

import java.time.LocalDateTime;

public record ReportDto(
        Long id,
        LocalDateTime creationTime,
        String reportType,
        String title,
        Long examinationId,
        UserDto generatedBy
) {
}
