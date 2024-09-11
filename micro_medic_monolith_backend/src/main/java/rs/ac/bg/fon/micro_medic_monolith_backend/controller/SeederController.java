package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.DiseaseService;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.MedicineService;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.SpecializationDepartmentsService;

@RestController
@RequestMapping("/api/v1/seed")
@RequiredArgsConstructor
@CrossOrigin
public class SeederController {

    private final DiseaseService diseaseService;
    private final MedicineService medicineService;
    private final SpecializationDepartmentsService specializationDepartmentsService;

    @GetMapping("/disease")
    public void seedDisease() throws Exception {
        diseaseService.populateDiseases();
    }

    @GetMapping("/medicine")
    public void seedMedicine() throws Exception {
        medicineService.populateMedicines();
    }

    @GetMapping("/specializationDepartments")
    public void seedSpecializationDepartments() throws Exception {
        specializationDepartmentsService.populateDepartments();
    }

}
