package rs.ac.bg.fon.micro_medic_monolith_backend.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.UnauthorizedActionException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ExaminationRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ReportRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ScheduledAppointmentRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.UserService;

@Service
@RequiredArgsConstructor
public class AccessGuard {

    private final UserService userService;
    private final ScheduledAppointmentRepository scheduledAppointmentRepository;
    private final ExaminationRepository examinationRepository;
    private final ReportRepository reportRepository;
    private final MedicalAccessRecorder recorder;

    @Transactional
    public void requirePatientAccess(Long patientId) {
        User current = userService.getCurrentUser();
        boolean isSelf = current instanceof Patient && current.getId().equals(patientId);
        // `&&`, not `&`. The bitwise operator does not short-circuit, so the repository call ran for
        // every caller including patients and admins — a wasted query on every read, and the reason
        // the guard's core rule reads as "a doctor may read a patient only if they treat them"
        // everywhere else. Same operator in the same position as the `&&` in requireAppointmentParticipant.
        boolean isTreatingDoctor = current instanceof Doctor
                && scheduledAppointmentRepository.existsByDoctorIdAndPatientId(current.getId(), patientId);

        if (isSelf || isTreatingDoctor || isAdmin(current)) {
            record(MedicalAccessLog.AccessedResourceType.PATIENT, patientId, patientId, current);
            return;
        }

        throw new UnauthorizedActionException("User does not have access to patient with ID: " + patientId);
    }

    @Transactional
    public void requireSelfDoctor(Long doctorId) {
        User current = userService.getCurrentUser();
        if ((current instanceof Doctor && current.getId().equals(doctorId)) || isAdmin(current)) {
            record(MedicalAccessLog.AccessedResourceType.DOCTOR, doctorId, null, current);
            return;
        }

        throw new UnauthorizedActionException("User does not have access to doctor with ID: " + doctorId);
    }

    @Transactional
    public void requireExaminationAccess(Long examinationId) {
        Examination examination = examinationRepository.findById(examinationId).orElseThrow(() -> new UnauthorizedActionException("Examination not found with ID: " + examinationId));
        ScheduledAppointment appointment = examination.getScheduledAppointment();
        User current = userService.getCurrentUser();

        /*
         * Authorise, then record. This method previously only recorded: it wrote a
         * `MedicalAccessLog` row and returned, so any authenticated user could read any
         * examination — and the audit trail dutifully logged the unauthorised read as if it were
         * fine. An audit of a check that never happened is worse than no audit, because it reads
         * as evidence the access was allowed.
         *
         * The admin bypass is taken here rather than left to `requireAppointmentParticipant`,
         * which throws on a null appointment *before* it reaches its own `isAdmin` check. That null
         * case is reachable: `Examination.scheduledAppointment` is nullable and
         * `ExaminationService.examine` accepts a request without one. For everyone else the
         * participant rule is the same one the other four require* methods apply, and denying is
         * the right answer for an appointment-less examination — it has no patient and no doctor,
         * so there is nobody with a claim to it. Mirrors the shape of `requireReportAccess`.
         */
        if (!isAdmin(current)) {
            requireAppointmentParticipant(appointment, "examination");
        }

        record(MedicalAccessLog.AccessedResourceType.EXAMINATION, examinationId, patientIdOf(appointment), current);
    }

    @Transactional
    public void requireReportAccess(Long reportId) {
        Report report = reportRepository.findById(reportId).orElseThrow(() -> new UnauthorizedActionException("Report not found with ID: " + reportId));

        Examination examination = report.getExamination();
        ScheduledAppointment appointment = examination == null ? null : examination.getScheduledAppointment();

        User current = userService.getCurrentUser();
        boolean isAuthor = report.getGeneratedBy() != null && report.getGeneratedBy().getId().equals(current.getId());

        if (isAuthor || isAdmin(current)) {
            record(MedicalAccessLog.AccessedResourceType.REPORT, reportId, patientIdOf(appointment), current);
            return;
        }

        requireAppointmentParticipant(appointment, "report");
    }

    @Transactional
    public void requireAppointmentAccess(Long appointmentId) {
        ScheduledAppointment appointment = scheduledAppointmentRepository.findById(appointmentId).orElseThrow(() -> new UnauthorizedActionException("Scheduled appointment not found with ID: " + appointmentId));

        requireAppointmentParticipant(appointment, "appointment");
        record(MedicalAccessLog.AccessedResourceType.APPOINTMENT, appointmentId, patientIdOf(appointment), userService.getCurrentUser());
    }

    private void requireAppointmentParticipant(ScheduledAppointment appointment, String resourceLabel) {
        if (appointment == null || appointment.getPatient() == null){
            throw new UnauthorizedActionException("Scheduled appointment or patient is null for " + resourceLabel);
        }

        User current = userService.getCurrentUser();
        Long patientId = appointment.getPatient().getId();
        // `Long`, not `long`: an appointment with no doctor is representable, and unboxing the null
        // branch of the ternary into a primitive throws NullPointerException instead of the
        // UnauthorizedActionException this method exists to throw — a 500 where a 403 belongs.
        // `equals` on the boxed value handles null correctly (it is simply not a match).
        Long doctorId = appointment.getDoctor() == null ? null : appointment.getDoctor().getId();
        boolean isOwningPatient = current instanceof Patient && current.getId().equals(patientId);
        boolean isOwningDoctor = current instanceof Doctor && current.getId().equals(doctorId);
        boolean isTreatingDoctor = current instanceof Doctor && scheduledAppointmentRepository.existsByDoctorIdAndPatientId(current.getId(), patientId);

        if (isOwningPatient || isOwningDoctor || isTreatingDoctor || isAdmin(current)) {
            return;
        }

        throw new UnauthorizedActionException("User does not have access to " + resourceLabel + " with ID: " + appointment.getId());
    }

    private boolean isAdmin(User user) {
        return user instanceof Admin;
    }

    private Long patientIdOf(ScheduledAppointment appointment){
        return appointment == null || appointment.getPatient() == null ? null : appointment.getPatient().getId();
    }

    private void record(MedicalAccessLog.AccessedResourceType resourceType, long resourceId, Long patientId, User accessor) {
        recorder.record(resourceType, resourceId, patientId, accessor);
    }
}