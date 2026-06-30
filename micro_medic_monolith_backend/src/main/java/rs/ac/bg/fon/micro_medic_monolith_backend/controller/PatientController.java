package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.PatientDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.PatientMedicalSummaryDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.PatientService;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.PatientSummaryService;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final PatientSummaryService patientSummaryService;

    @GetMapping
    public Page<PatientDto> getPatients(@PageableDefault(size = 10) Pageable pageable) {
        return patientService.listPatients(pageable).map(DtoMapper::toPatientDto);
    }

    @GetMapping("/search")
    public Page<PatientDto> searchPatients(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 10) Pageable pageable) {
        return patientService.searchPatients(query, pageable).map(DtoMapper::toPatientDto);
    }

    @GetMapping("/{id}")
    public PatientDto getPatient(@RequestParam Long id) {
        return DtoMapper.toPatientDto(patientService.getById(id));
    }

    @GetMapping("/{id}/summary")
    public PatientMedicalSummaryDto getPatientSummary(@RequestParam Long id) {
        return patientSummaryService.getMedicalSummary(id);
    }
}
