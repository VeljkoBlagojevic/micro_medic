package rs.ac.bg.fon.micro_medic_monolith_backend.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.UnauthorizedActionException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ExaminationRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.MedicalAccessLogRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ReportRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ScheduledAppointmentRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.UserService;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AccessGuard {

    private final UserService userService;
    private final ScheduledAppointmentRepository scheduledAppointmentRepository;
    private final ExaminationRepository examinationRepository;
    private final ReportRepository reportRepository;
    private final MedicalAccessLogRepository medicalAccessLogRepository;

    @Transactional
    public void requirePatientAccess(Long patientId) {
        User current = userService.getCurrentUser();
        if (current instanceof Patient && current.getId().equals(patientId)) {
            record(MedicalAccessLog.AccessedResourceType.PATIENT, patientId, patientId, current);
            return;
        }
        if (current instanceof Doctor && scheduledAppointmentRepository.existsByDoctorIdAndPatientId(current.getId(), patientId)) {
            record(MedicalAccessLog.AccessedResourceType.PATIENT, patientId, patientId, current);
            return;
        }

        throw new UnauthorizedActionException("User does not have access to patient with ID: " + patientId);
    }

    @Transactional
    public void requireSelfDoctor(Long doctorId) {
        User current = userService.getCurrentUser();
        if (current instanceof Doctor && current.getId().equals(doctorId)) {
            record(MedicalAccessLog.AccessedResourceType.DOCTOR, doctorId, null, current);
            return;
        }

        throw new UnauthorizedActionException("User does not have access to doctor with ID: " + doctorId);
    }

    @Transactional
    public void requireExaminationAccess(Long examinationId) {
        Examination examination = examinationRepository.findById(examinationId)
                .orElseThrow(() -> new UnauthorizedActionException("Examination not found with ID: " + examinationId));
        ScheduledAppointment appointment = examination.getScheduledAppointment();
        requireAppointmentParticipant(appointment, "examination");
        Long patientId = appointment.getPatient().getId();
        record(MedicalAccessLog.AccessedResourceType.EXAMINATION, examinationId, patientId, userService.getCurrentUser());
    }

    @Transactional
    public void requireReportAccess(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new UnauthorizedActionException("Report not found with ID: " + reportId));

        User current = userService.getCurrentUser();
        if (report.getGeneratedBy() != null && report.getGeneratedBy().getId().equals(current.getId())) {
            record(MedicalAccessLog.AccessedResourceType.REPORT, reportId, null, current);
            return;
        }
        Examination examination = report.getExamination();
        ScheduledAppointment appointment = examination.getScheduledAppointment();
        requireAppointmentParticipant(appointment, "report");
        record(MedicalAccessLog.AccessedResourceType.REPORT, reportId, appointment.getPatient().getId(), current);
    }

    @Transactional
    public void requireAppointmentAccess(Long appointmentId) {
        ScheduledAppointment appointment = scheduledAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new UnauthorizedActionException("Scheduled appointment not found with ID: " + appointmentId));
        requireAppointmentParticipant(appointment, "appointment");
    }

    private void requireAppointmentParticipant(ScheduledAppointment appointment, String resourceLabel) {
        if (appointment == null || appointment.getPatient() == null) {
            throw new UnauthorizedActionException("Scheduled appointment or patient is null for " + resourceLabel);
        }

        User current = userService.getCurrentUser();
        Long patientId = appointment.getPatient().getId();
        Long doctorId = appointment.getDoctor().getId();

        boolean isOwningPatient = current instanceof Patient && current.getId().equals(patientId);
        boolean isOwningDoctor = current instanceof Doctor && current.getId().equals(doctorId);
        boolean isTreatingDoctor = current instanceof Doctor && scheduledAppointmentRepository.existsByDoctorIdAndPatientId(current.getId(), patientId);

        if (isOwningPatient || isOwningDoctor || isTreatingDoctor) {
            return;
        }

        throw new UnauthorizedActionException("User does not have access to " + resourceLabel + " with ID: " + appointment.getId());
    }

    private void record(MedicalAccessLog.AccessedResourceType accessedResourceType, Long resourceId, Long patientId, User accessor) {
        MedicalAccessLog log = MedicalAccessLog.builder()
                .accessorId(accessor.getId())
                .accessorRole(accessor.getRole() != null ? accessor.getRole().name() : null)
                .resourceType(accessedResourceType)
                .resourceId(resourceId)
                .patientId(patientId)
                .accessedAt(LocalDateTime.now())
                .build();
        medicalAccessLogRepository.save(log);
    }
}
