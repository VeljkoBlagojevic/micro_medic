package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Examination;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Report;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Therapy;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.DuplicateResourceException;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.EntityNotFoundException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ReportRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification.ReportSpecification;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.security.AccessGuard;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ExaminationService examinationService;
    private final TherapyService therapyService;
    private final UserService userService;
    private final PdfGenerationService pdfService;
    private final AccessGuard accessGuard;

    @PreAuthorize("hasAuthority('ROLE_DOCTOR') or hasAuthority('ROLE_ADMIN')")
    public Report generateExaminationReport(Long examinationId) {
        if (reportRepository.findByExaminationId(examinationId).isPresent()) {
            throw new DuplicateResourceException("Report", "examinationId", examinationId);
        }

        Examination examination = examinationService.getById(examinationId).getFirst();
        User currentUser = userService.getCurrentUser();

        Report report = Report.builder()
                .creationTime(LocalDateTime.now())
                .type(Report.Type.EXAMINATION_REPORT)
                .title("Examination Report #" + examinationId)
                .examination(examination)
                .generatedBy(currentUser)
                .build();

        log.info("Generating examination report for examination ID: {}", examinationId);
        return reportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public Report getById(Long reportId) {
        accessGuard.requireReportAccess(reportId);
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Report not found with ID: " + reportId));
    }

    @Transactional(readOnly = true)
    public Report getByExaminationId(Long examinationId) {
        Report report = reportRepository.findByExaminationId(examinationId)
                .orElseThrow(() -> new EntityNotFoundException("Report not found for examination ID: " + examinationId));
        // Authorize against the report actually being returned, not against whichever report
        // happens to share the examination's numeric id.
        accessGuard.requireReportAccess(report.getId());
        return report;
    }

    @Transactional(readOnly = true)
    public Page<Report> getReportsByPatient(Long patientId, Pageable pageable) {
        accessGuard.requirePatientAccess(patientId);
        return reportRepository.findByExaminationScheduledAppointmentPatientId(patientId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Report> getMyReport(Pageable pageable) {
        User currentUser = userService.getCurrentUser();
        return reportRepository.findByGeneratedById(currentUser.getId(), pageable);
    }

    @Transactional(readOnly = true)
    public Page<Report> search(
            Long patientId, Long generatedBy,
            Report.Type type, LocalDateTime from, LocalDateTime to,
            Pageable pageable) {
        if (patientId == null && generatedBy == null) {
            throw new IllegalArgumentException("At least one of patientId or generatedBy must be provided for searching reports.");
        }

        if (patientId != null) {
            accessGuard.requirePatientAccess(patientId);
        }

        if (generatedBy != null) {
            accessGuard.requireSelfDoctor(generatedBy);
        }

        Specification<Report> spec = Specification.allOf(
                ReportSpecification.hasPatientId(patientId),
                ReportSpecification.hasGeneratedBy(generatedBy),
                ReportSpecification.hasType(type),
                ReportSpecification.createdAfter(from),
                ReportSpecification.createdBefore(to)
        );

        return reportRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public byte[] generateReportPdf(Long reportId) {
        Report report = getById(reportId);
        Examination examination = report.getExamination();
        Therapy therapy = therapyService.getByExaminationId(examination.getId()).orElseThrow(() -> new EntityNotFoundException("Therapy not found for examination ID: " + examination.getId()));
        return pdfService.generateExaminationReportPdf(report, examination, therapy);
    }



}