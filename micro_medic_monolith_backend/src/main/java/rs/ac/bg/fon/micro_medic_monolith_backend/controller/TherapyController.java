package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.TherapyDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.TherapyService;

@RestController
@RequestMapping("/api/therapies")
@RequiredArgsConstructor
public class TherapyController {

    private final TherapyService service;

    @GetMapping
    public Page<TherapyDto> getAllTherapies(@PageableDefault(size = 10) Pageable pageable) {
        return service.getAll(pageable).map(DtoMapper::toTherapyDto);
    }
}
