package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.SpecializationDepartment;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Therapy;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.SpecializationDepartmentsService;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.TherapyService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/specializationDepartment")
@RequiredArgsConstructor
@CrossOrigin
public class SpecializationDepartmentController {

    private final SpecializationDepartmentsService specializationDepartmentsService;

    @GetMapping
    public List<SpecializationDepartment> getAllSpecializationDepartments() {
        return specializationDepartmentsService.getAll();
    }

    @GetMapping("/{id}")
    public SpecializationDepartment getSpecializationDepartmentById(@PathVariable Long id) {
        return specializationDepartmentsService.getById(id);
    }

}
