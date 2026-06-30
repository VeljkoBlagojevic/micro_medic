package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DiseaseDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.DiseaseService;

@RestController
@RequestMapping("/api/diseases")
@RequiredArgsConstructor
public class DiseaseController {

    private final DiseaseService diseaseService;

    @GetMapping
    public Page<DiseaseDto> getAllDiseases(@PageableDefault(size = 10) Pageable pageable) {
        return diseaseService.getDiseases(pageable).map(DtoMapper::toDiseaseDto);
    }

    @GetMapping("/search")
    public Page<DiseaseDto> searchDiseases(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 10) Pageable pageable) {
        return diseaseService.search(query, pageable).map(DtoMapper::toDiseaseDto);
    }

    @GetMapping("/{id}")
    public DiseaseDto getDisease(@PathVariable String id) {
        return DtoMapper.toDiseaseDto(diseaseService.getById(id));
    }
}
