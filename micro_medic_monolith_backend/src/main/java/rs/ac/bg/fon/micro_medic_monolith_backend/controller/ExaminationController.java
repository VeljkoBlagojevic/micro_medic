package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Examination;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.ExaminationDetailDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.ExaminationDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.ExaminationRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.ExaminationService;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.TherapyService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/examinations")
@RequiredArgsConstructor
public class ExaminationController {

    private final ExaminationService examinationService;
    private final TherapyService therapyService;

    @PostMapping
    public ExaminationDetailDto examine(@RequestBody @Valid ExaminationRequest request) {
        return DtoMapper.toExaminationDetailDto(examinationService.examine(request).getFirst(), examinationService.examine(request).getSecond());
    }

    @GetMapping("/{id}")
    public ExaminationDetailDto getExamination(@PathVariable Long id) {
        return DtoMapper.toExaminationDetailDto(examinationService.getById(id).getFirst(), examinationService.getById(id).getSecond());
    }

    @GetMapping("/patient/{patientId}")
    public Page<ExaminationDto> getExaminationsForPatient(
            @PathVariable Long patientId,
            @PageableDefault(size = 10) @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Examination> examinations = examinationService.getExaminationsForPatient(patientId, pageable);
        return examinations.map(DtoMapper::toExaminationDto);
    }

    @GetMapping("/doctor/{doctorId}")
    public Page<ExaminationDto> getExaminationsForDoctor(
            @PathVariable Long doctorId,
            @PageableDefault(size = 10) @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Examination> examinations = examinationService.getExaminationsForDoctor(doctorId, pageable);
        return examinations.map(DtoMapper::toExaminationDto);
    }

    @GetMapping("/search")
    public Page<ExaminationDto> searchExaminations(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Examination.Status examinationStatus,
            @RequestParam(required = false) String diagnosisCode,
            @RequestParam(required = false) LocalDateTime startedAfter,
            @RequestParam(required = false) LocalDateTime startedBefore,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<Examination> examinations = examinationService.search(patientId, doctorId, examinationStatus, diagnosisCode, startedAfter, startedBefore, pageable);
        return examinations.map(DtoMapper::toExaminationDto);
    }

}
