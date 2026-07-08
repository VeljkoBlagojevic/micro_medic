package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.MedicineDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.MedicineService;

@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    @GetMapping
    public Page<MedicineDto> getAllMedicines(@PageableDefault(size = 10) Pageable pageable) {
        return medicineService.getAll(pageable).map(DtoMapper::toMedicineDto);
    }

    @GetMapping("/search")
    public Page<MedicineDto> searchMedicines(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 10) Pageable pageable) {
        return medicineService.search(query, pageable)
                .map(DtoMapper::toMedicineDto);
    }

    @GetMapping("/{id}")
    public MedicineDto getMedicineById(@PathVariable Long id) {
        return DtoMapper.toMedicineDto(medicineService.getById(id));
    }
}
