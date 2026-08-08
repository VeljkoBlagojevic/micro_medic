package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Examination;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Disease;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DoctorStatsDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.PatientStatsDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ExaminationRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ScheduledAppointmentRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.security.AccessGuard;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    /**
     * How many recent examinations feed the top-diagnoses ranking.
     */
    private static final int TOP_DIAGNOSES_SAMPLE_SIZE = 1000;
    private static final int TOP_DIAGNOSES_LIMIT = 5;

    private final ExaminationRepository examinationRepository;
    private final ScheduledAppointmentRepository scheduledAppointmentRepository;
    private final AccessGuard accessGuard;

    @Transactional(readOnly = true)
    public DoctorStatsDto getDoctorStats(Long doctorId) {
        accessGuard.requireSelfDoctor(doctorId);
        long totalExaminations = examinationRepository.countByDoctorId(doctorId);
        long totalScheduledAppointments = scheduledAppointmentRepository.countByDoctorId(doctorId);
        long uniquePatients = examinationRepository.countDistinctPatientsByDoctorId(doctorId);

        Page<Examination> examinationPage = examinationRepository.findByDoctorId(doctorId, PageRequest.of(0, TOP_DIAGNOSES_SAMPLE_SIZE));
        List<Examination> examinations = examinationPage.getContent();

        List<DoctorStatsDto.DiagnosisCountDto> topDiagnoses = getTopDiagnoses(examinations);

        return new DoctorStatsDto(totalExaminations, totalScheduledAppointments, uniquePatients, topDiagnoses);
    }

    @Transactional(readOnly = true)
    public PatientStatsDto getPatientsStats(Long patientId) {
        accessGuard.requirePatientAccess(patientId);
        long totalExaminations = examinationRepository.countByPatientId(patientId);
        long totalScheduledAppointments = scheduledAppointmentRepository.countByPatientId(patientId);
        long upcomingAppointments = scheduledAppointmentRepository.countUpcomingByPatientId(patientId, java.time.LocalDateTime.now());
        long distinctDoctorsSeen = examinationRepository.countDistinctDoctorsByPatientId(patientId);

        return new PatientStatsDto(totalExaminations, totalScheduledAppointments, upcomingAppointments, distinctDoctorsSeen);
    }

    private List<DoctorStatsDto.DiagnosisCountDto> getTopDiagnoses(List<Examination> examinations) {
        return examinations.stream()
                .filter(exam -> exam.getDiagnosis() != null && exam.getDiagnosis().getCode() != null)
                .collect(Collectors.groupingBy(exam -> exam.getDiagnosis().getCode()))
                .entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue().size(), e1.getValue().size()))
                .limit(TOP_DIAGNOSES_LIMIT)
                .map(entry -> {
                    Examination representative = entry.getValue().iterator().next();
                    Disease diagnosis = representative.getDiagnosis();
                    return new DoctorStatsDto.DiagnosisCountDto(
                            diagnosis.getCode(),
                            diagnosis.getDescription(),
                            entry.getValue().size()
                    );
                })
                .collect(Collectors.toList());
    }

}
