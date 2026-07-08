package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DoctorDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.DoctorService;

@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public Page<DoctorDto> getAllDoctors(@PageableDefault(size = 10)Pageable pageable) {
        return doctorService.getAll(pageable)
                .map(DtoMapper::toDoctorDto);
    }

    @GetMapping("/search")
    public Page<DoctorDto> searchDoctors(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 10) Pageable pageable) {
        return doctorService.search(query, pageable)
                .map(DtoMapper::toDoctorDto);
    }

    @GetMapping("/search/filter")
    public Page<DoctorDto> searchDoctorsWithFilters(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long specializationId,
            @RequestParam(required = false) String specializationName,
            @PageableDefault(size = 10) Pageable pageable) {
        return doctorService.searchFiltered(query, specializationId, specializationName, pageable)
                .map(DtoMapper::toDoctorDto);
    }

    @GetMapping("/{id}")
    public DoctorDto getDoctorById(@PathVariable Long id) {
        return DtoMapper.toDoctorDto(doctorService.getById(id));
    }
}
