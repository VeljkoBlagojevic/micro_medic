package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import java.time.LocalDateTime;

public record ExaminationDetailDto(
        Long id,
        LocalDateTime start, LocalDateTime end,
        String anamnesis,
        String status,
        DiseaseDto disease,
        ScheduledAppointmentDto scheduledAppointment,
        TherapyDto therapy
) {
}
