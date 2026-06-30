package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import java.util.List;

public record DoctorStatsDto(
        long totalExaminations,
        long totalAppointments,
        long uniquePatientsSeen,
        List<DiagnosisCountDto> topDiagnoses
) {
    public record DiagnosisCountDto(
            String diagnosisCode,
            String diseaseDescription,
            long count) { }
}
