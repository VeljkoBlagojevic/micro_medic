package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Therapy;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.TherapyService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/therapy")
@RequiredArgsConstructor
@CrossOrigin
public class TherapyController {

    private final TherapyService therapyService;

    @GetMapping
    public List<Therapy> getAllTherapies() {
        return therapyService.getAll();
    }

    @GetMapping("/{id}")
    public Therapy getTherapyById(@PathVariable Long id) {
        return therapyService.getById(id);
    }

}
