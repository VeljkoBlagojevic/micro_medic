package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Medicine;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.MedicineService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medicine")
@RequiredArgsConstructor
@CrossOrigin
public class MedicineController {

    private final MedicineService medicineService;

    @GetMapping
    public List<Medicine> getAllMedicine() {
        return medicineService.getAll();
    }

    @GetMapping("/{id}")
    public Medicine getMedicineById(@PathVariable Long id) {
        return medicineService.getById(id);
    }

}
