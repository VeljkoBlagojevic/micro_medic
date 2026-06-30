package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.MedicalAccessLog;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.MedicalAccessLogDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.AuditService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    public Page<MedicalAccessLogDto> getAuditLogs(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long accessorId,
            @RequestParam(required = false) MedicalAccessLog.AccessedResourceType resourceType,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return auditService
                .getAllAccessLogs(patientId, accessorId, resourceType, startDate, endDate, pageable)
                .map(DtoMapper::toMedicalAccessLogDto);
    }
}
