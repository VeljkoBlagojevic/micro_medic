package rs.ac.bg.fon.micro_medic_monolith_backend.controller.pregled;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Examination;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.PregledService;

@RestController
@RequestMapping("pregledi")
@RequiredArgsConstructor
@CrossOrigin
public class PregledController {

    private final PregledService pregledService;

    @PostMapping
    public Examination izvrsiPregled(@RequestBody @Valid PregledRequest pregledRequest) {
        return pregledService.izvrsiPregled(pregledRequest);
    }




}
