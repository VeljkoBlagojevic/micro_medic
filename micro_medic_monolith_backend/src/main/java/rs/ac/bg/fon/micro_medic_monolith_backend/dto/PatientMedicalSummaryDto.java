package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import java.util.List;

public record PatientMedicalSummaryDto(
        PatientDto patient,
        PatientStatsDto stats,
        List<ExaminationDetailDto> examinations,
        List<ScheduledAppointmentDto> scheduledAppointments
) {
}
