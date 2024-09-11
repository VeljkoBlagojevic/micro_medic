package rs.ac.bg.fon.micro_medic_monolith_backend.controller.examination;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Examination;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.ExaminationService;

@RestController
@RequestMapping("/api/v1/examination")
@RequiredArgsConstructor
@CrossOrigin
public class ExaminationController {

    private final ExaminationService examinationService;

    @PostMapping
    public Examination examine(@RequestBody @Valid ExaminationRequest examinationRequest) {
        return examinationService.examine(examinationRequest);
    }




}
