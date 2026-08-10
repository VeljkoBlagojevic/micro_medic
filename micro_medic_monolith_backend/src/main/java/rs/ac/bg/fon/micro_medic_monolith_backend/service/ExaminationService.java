package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.util.Pair;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.ExaminationDetailDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.ExaminationRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.EntityNotFoundException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification.ExaminationSpecification;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.security.AccessGuard;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExaminationService {

    private final ExaminationRepository examinationRepository;
    private final ScheduledAppointmentRepository scheduledAppointmentRepository;
    private final DiseaseRepository diseaseRepository;
    private final TherapyRepository therapyRepository;
    private final MedicineRepository medicineRepository;
    private final AccessGuard accessGuard;

    @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
    @Transactional
    public Pair<Examination, Therapy> examine(ExaminationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Examination request cannot be null");
        }

        ScheduledAppointment appointment = null;
        if (request.scheduledAppointmentId() != null) {
            /*
             * Row-level ownership, and the audit row that goes with it.
             *
             * `@PreAuthorize` above establishes only that the caller is *a* doctor, not that they
             * are the doctor on this appointment — without this call any doctor could record an
             * examination against any patient, and the write would go unaudited because audit
             * logging in this application is explicit and has no interceptor behind it. Every read
             * path in this class already guards; the write that creates the medical record is the
             * one that most needs to.
             *
             * Before `findById`, deliberately: the guard's own lookup throws
             * UnauthorizedActionException (403) for an appointment that does not exist, and
             * answering "no such appointment" to a caller with no claim to it is an enumeration
             * oracle over other doctors' schedules.
             */
            accessGuard.requireAppointmentAccess(request.scheduledAppointmentId());

            appointment = scheduledAppointmentRepository.findById(request.scheduledAppointmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Scheduled appointment not found with ID: " + request.scheduledAppointmentId()));

            if (appointment.getStatus() != ScheduledAppointment.Status.SCHEDULED) {
                throw new IllegalArgumentException("Scheduled appointment with ID: " + request.scheduledAppointmentId() + " is not in SCHEDULED status");
            }

            if (examinationRepository.findByScheduledAppointmentId(request.scheduledAppointmentId()).isPresent()) {
                throw new IllegalArgumentException("Examination for scheduled appointment with ID: " + request.scheduledAppointmentId() + " already exists");
            }
        }

        String diagnosisId = request.diagnosisCode();
        var diagnosis = diseaseRepository.findById(diagnosisId)
                .orElseThrow(() -> new IllegalArgumentException("Disease not found with code: " + diagnosisId));

        List<MedicineUsage> medicineUsages = request.medicineUsages().stream()
                .map(mu -> {
                    var medicine = medicineRepository.findById(mu.medicineId())
                            .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + mu.medicineId()));
                    return MedicineUsage.builder()
                            .medicine(medicine)
                            .methodUse(mu.methodUse())
                            .frequencyIntakeInHours(mu.usageFrequencyInHours())
                            .build();
                })
                .toList();

        var examination = Examination.builder()
                .start(request.startTime())
                .end(LocalDateTime.now())
                .anamnesis(request.medicalHistory())
                .status(Examination.Status.COMPLETED)
                .scheduledAppointment(appointment)
                .diagnosis(diagnosis)
                .build();

        var savedExamination = examinationRepository.save(examination);

        if (appointment != null) {
            appointment.setStatus(ScheduledAppointment.Status.COMPLETED);
            scheduledAppointmentRepository.save(appointment);
        }

        var therapy = Therapy.builder()
                .examination(savedExamination)
                .medicineUsages(medicineUsages)
                .instructions(request.therapyDescription())
                .build();

        medicineUsages.forEach(mu -> mu.setTherapy(therapy));
        var savedTherapy = therapyRepository.save(therapy);

        return Pair.of(savedExamination, savedTherapy);
    }

    @Transactional(readOnly = true)
    public Pair<Examination, Therapy> getById(Long id) {
        accessGuard.requireExaminationAccess(id);
        var examination = examinationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Examination not found with ID: " + id));
        var therapy = therapyRepository.findByExaminationId(id)
                .orElseThrow(() -> new EntityNotFoundException("Therapy not found for examination with ID: " + id));
        return Pair.of(examination, therapy);
    }

    @Transactional(readOnly = true)
    public Page<Examination> getExaminationsForPatient(Long patientId, Pageable pageable) {
        accessGuard.requirePatientAccess(patientId);
        return examinationRepository.findByPatientId(patientId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Examination> getExaminationsForDoctor(Long doctorId, Pageable pageable) {
        accessGuard.requireSelfDoctor(doctorId);
        return examinationRepository.findByDoctorId(doctorId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Examination> search(
            Long patientId, Long doctorId,
            Examination.Status status, String diagnosisCode,
            LocalDateTime startedAfter, LocalDateTime startedBefore,
            Pageable pageable) {

        if (patientId == null && doctorId == null) {
            throw new IllegalArgumentException("Both patientId and doctorId must be provided for search");
        }

        if (patientId != null) {
            accessGuard.requirePatientAccess(patientId);
        }

        if (doctorId != null) {
            accessGuard.requireSelfDoctor(doctorId);
        }

        Specification<Examination> spec = Specification.allOf(
                ExaminationSpecification.hasPatientId(patientId),
                ExaminationSpecification.hasDoctorId(doctorId),
                ExaminationSpecification.hasStatus(status),
                ExaminationSpecification.hasDiagnosisCode(diagnosisCode),
                ExaminationSpecification.startedAfter(startedAfter),
                ExaminationSpecification.startedBefore(startedBefore)
        );

        return examinationRepository.findAll(spec, pageable);
    }
}
