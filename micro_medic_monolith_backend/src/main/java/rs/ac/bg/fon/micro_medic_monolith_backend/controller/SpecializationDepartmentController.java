package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.SpecializationDepartmentDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.SpecializationService;

@RestController
@RequestMapping("/api/specializationDepartments")
@RequiredArgsConstructor
public class SpecializationDepartmentController {

    private final SpecializationService service;

    @GetMapping
    public Page<SpecializationDepartmentDto> getAllSpecializationDepartments(@PageableDefault(size = 10) Pageable pageable) {
        return service.getAll(pageable)
                .map(DtoMapper::toSpecializationDepartmentDto);
    }

    @GetMapping("/{id}")
    public SpecializationDepartmentDto getSpecializationDepartmentById(@PathVariable Long id) {
        return DtoMapper.toSpecializationDepartmentDto(service.getById(id));
    }
}
