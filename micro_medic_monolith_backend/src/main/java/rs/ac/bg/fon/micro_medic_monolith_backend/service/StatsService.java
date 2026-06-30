package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
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

    private final ExaminationRepository examinationRepository;
    private final ScheduledAppointmentRepository scheduledAppointmentRepository;
    private final AccessGuard accessGuard;

    @Transactional(readOnly = true)
    public DoctorStatsDto getDoctorStats(Long doctorId) {
        accessGuard.requireSelfDoctor(doctorId);
        long totalExaminations = examinationRepository.countByDoctorId(doctorId);
        long totalScheduledAppointments = scheduledAppointmentRepository.countByDoctorId(doctorId);
        long uniquePatients = examinationRepository.countDistinctPatientsByDoctorId(doctorId);

        List<Examination> examinations = examinationRepository.findByDoctorId(doctorId, PageRequest.of(0, Integer.MAX_VALUE)).getContent();

        List<DoctorStatsDto.DiagnosisCountDto> topDiagnoses = getTopDiagnoses(examinations);

        return new DoctorStatsDto(totalExaminations, totalScheduledAppointments, uniquePatients, topDiagnoses);
    }

    @Transactional(readOnly = true)
    public PatientStatsDto getPatientsStats(Long patientId) {
        accessGuard.requirePatientAccess(patientId);
        long totalExaminations = examinationRepository.countByPatientId(patientId);
        long totalScheduledAppointments = scheduledAppointmentRepository.countByPatientId(patientId);
        long uniqueDoctors = examinationRepository.countDistinctDoctorsByPatientId(patientId);

        List<Examination> examinations = examinationRepository.findByPatientId(patientId, PageRequest.of(0, Integer.MAX_VALUE)).getContent();

        long uniqueDiagnoses = examinations.stream()
                .map(Examination::getDiagnosis)
                .filter(diagnosis -> diagnosis != null && diagnosis.getCode() != null)
                .map(Disease::getCode)
                .distinct()
                .count();

        return new PatientStatsDto(totalExaminations, totalScheduledAppointments, uniqueDoctors, uniqueDiagnoses);
    }

    private List<DoctorStatsDto.DiagnosisCountDto> getTopDiagnoses(List<Examination> examinations) {
        return examinations.stream()
                .filter(exam -> exam.getDiagnosis() != null && exam.getDiagnosis().getCode() != null)
                .collect(Collectors.groupingBy(exam -> exam.getDiagnosis().getCode()))
                .entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue().size(), e1.getValue().size()))
                .limit(5)
                .map(entry -> {
                    Examination representative = entry.getValue().iterator().next();
                    return new DoctorStatsDto.DiagnosisCountDto(
                            representative.getDiagnosis().getCode(),
                            representative.getDiagnosis().getCode(),
                            entry.getValue().size()
                    );
                })
                .collect(Collectors.toList());
    }

}
