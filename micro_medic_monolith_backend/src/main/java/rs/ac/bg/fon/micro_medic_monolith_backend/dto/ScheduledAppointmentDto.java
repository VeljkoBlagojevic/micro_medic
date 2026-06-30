package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import java.time.LocalDateTime;

public record ScheduledAppointmentDto(
        Long id,
        LocalDateTime start, LocalDateTime end,
        PatientDto patient, DoctorDto doctor,
        String status
) {
}
