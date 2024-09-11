package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Disease;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.DiseaseService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/disease")
@RequiredArgsConstructor
@CrossOrigin
public class DiseaseController {

    private final DiseaseService diseaseService;

    @GetMapping
    public List<Disease> getAll() {
        return diseaseService.getAll();
    }

    @GetMapping("/{id}")
    public Disease getById(@PathVariable String id) {
        return diseaseService.getById(id);
    }

}
