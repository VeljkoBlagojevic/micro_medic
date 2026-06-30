package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

public record PatientStatsDto(
        long totalExaminations,
        long totalAppointments,
        long upcomingAppointments,
        long distinctDoctorsSeen
) {
}
