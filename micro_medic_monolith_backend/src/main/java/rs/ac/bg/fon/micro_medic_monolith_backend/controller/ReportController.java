package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Report;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.ReportDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.ReportService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/examination/{examinationId}")
    public ReportDto getReportForExamination(@PathVariable Long examinationId) {
        return DtoMapper.toReportDto(reportService.getByExaminationId(examinationId));
    }

    @GetMapping("/me")
    public Page<ReportDto> getReportsForCurrentUser(@PageableDefault(size = 10) Pageable pageable) {
        return reportService.getMyReport(pageable).map(DtoMapper::toReportDto);
    }

    @GetMapping("/search")
    public Page<ReportDto> searchReports(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long generatedBy,
            @RequestParam(required = false) Report.Type type,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            @PageableDefault(size = 10) Pageable pageable) {
        return reportService.search(patientId, generatedBy, type, startDate, endDate, pageable).map(DtoMapper::toReportDto);
    }

    @GetMapping("/{id}")
    public ReportDto getReport(@PathVariable Long id) {
        return DtoMapper.toReportDto(reportService.getById(id));
    }

    @PostMapping("/examination/{examinationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportDto generateReportForExamination(@PathVariable Long examinationId) {
        return DtoMapper.toReportDto(reportService.generateExaminationReport(examinationId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long id) {
        byte[] pdfReport = reportService.generateReportPdf(id);
        return ResponseEntity.ok(pdfReport);
    }

    @GetMapping("/patient/{patientId}")
    public Page<ReportDto> getReportsForPatient(@PathVariable Long patientId, @PageableDefault(size = 10) Pageable pageable) {
        return reportService.getReportsByPatient(patientId, pageable).map(DtoMapper::toReportDto);
    }
}
