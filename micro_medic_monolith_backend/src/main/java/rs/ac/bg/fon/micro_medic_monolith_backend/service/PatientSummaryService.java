package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Examination;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.ScheduledAppointment;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ExaminationRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ScheduledAppointmentRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.security.AccessGuard;

import java.util.List;


@Service
@RequiredArgsConstructor
public class PatientSummaryService {

    private final PatientService patientService;
    private final StatsService statsService;
    private final ExaminationRepository examinationRepository;
    private final TherapyService therapyService;
    private final ScheduledAppointmentRepository scheduledAppointmentRepository;
    private final AccessGuard accessGuard;

    @Transactional(readOnly = true)
    public PatientMedicalSummaryDto getMedicalSummary(Long patientId) {
        accessGuard.requirePatientAccess(patientId);
        var patient = patientService.getById(patientId);
        var stats = statsService.getPatientsStats(patientId);

        List<Examination> recentExams = examinationRepository
                .findByPatientId(patientId, PageRequest.of(0, 5))
                .getContent();

        List<ExaminationDetailDto> examDtos = recentExams.stream()
                .map(exam -> {
                    var therapy = therapyService.getByExaminationId(exam.getId()).orElse(null);
                    return DtoMapper.toExaminationDetailDto(exam, therapy);
                }).toList();

        List<ScheduledAppointment> upcoming = scheduledAppointmentRepository
                .findByPatientIdOrderByStartAsc(patientId, Pageable.unpaged())
                .stream()
                .filter(app -> app.getStart().isAfter(java.time.LocalDateTime.now()))
                .filter(app -> app.getStatus() == ScheduledAppointment.Status.SCHEDULED)
                .limit(5)
                .toList();

        List<ScheduledAppointmentDto> upcomingDtos = upcoming.stream()
                .map(DtoMapper::toScheduledAppointmentDto)
                .toList();

        return new PatientMedicalSummaryDto(DtoMapper.toPatientDto(patient), stats, examDtos, upcomingDtos);
    }


}
