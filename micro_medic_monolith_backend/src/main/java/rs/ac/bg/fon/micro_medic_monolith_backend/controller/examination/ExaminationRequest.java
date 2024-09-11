package rs.ac.bg.fon.micro_medic_monolith_backend.controller.examination;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDateTime;
import java.util.List;

public record ExaminationRequest(
        @PastOrPresent(message = "Start time can't be in the future")
        LocalDateTime start,

        @NotBlank(message = "Medical history can't be blank")
        String medicalHistory,

        @NotBlank(message = "Diagnosis code can't be blank")
        String diagnosisCode,

        @NotBlank(message = "Therapy description can't be blank")
        String therapyDescription,

        List<MedicineUsageRequest> medicationAdministration) { }
