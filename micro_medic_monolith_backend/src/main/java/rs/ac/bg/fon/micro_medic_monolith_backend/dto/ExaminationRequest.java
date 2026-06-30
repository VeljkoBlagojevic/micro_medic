package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDateTime;
import java.util.List;

public record ExaminationRequest(
        Long scheduledAppointmentId,

        @PastOrPresent
        LocalDateTime startTime,

        @NotBlank
        String medicalHistory,

        @NotBlank
        String diagnosisCode,

        @NotBlank
        String therapyDescription,

        List<MedicineUsageRequest> medicineUsages
) {
}
