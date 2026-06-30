package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.DiseaseService;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.MedicineService;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.SpecializationService;

@RestController
@RequestMapping("/api/seeder")
@RequiredArgsConstructor
@Profile("dev")
public class SeederController {

    private final DiseaseService diseaseService;
    private final MedicineService medicineService;
    private final SpecializationService specializationsService;

    @PostMapping("/disease")
    public ResponseEntity<String> seedDiseases() {
        diseaseService.populateDiseases();
        return ResponseEntity.ok("Diseases seeded successfully.");
    }

    @PostMapping("/medicine")
    public ResponseEntity<String> seedMedicines() {
        medicineService.populateMedicines();
        return ResponseEntity.ok("Medicines seeded successfully.");
    }

    @PostMapping("/specialization")
    public ResponseEntity<String> seedSpecializations() {
        specializationsService.populateSpecializations();
        return ResponseEntity.ok("Specializations seeded successfully.");
    }
}
