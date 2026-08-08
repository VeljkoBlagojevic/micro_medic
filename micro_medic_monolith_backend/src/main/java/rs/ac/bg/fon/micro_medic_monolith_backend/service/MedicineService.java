package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Medicine;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.EntityNotFoundException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.MedicineRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final MedicineRepository repository;

    @CacheEvict(value = "medicines", allEntries = true)
    @Transactional
    public void populateMedicines() {
        ObjectMapper objectMapper = new ObjectMapper();
        try (InputStream inputStream = getClass().getResourceAsStream("/medicines.json")) {
            if (inputStream == null) {
                throw new IllegalArgumentException("Resource /medicines.json not found on the classpath");
            }
            List<Medicine> medicines = objectMapper.readValue(inputStream, new TypeReference<List<Medicine>>() {
            });

            Set<Long> existingIds = repository.findAllById(medicines.stream().map(Medicine::getId).toList()).stream()
                    .map(Medicine::getId)
                    .collect(Collectors.toSet());

            List<Medicine> newMedicines = medicines.stream()
                    .filter(medicine -> !existingIds.contains(medicine.getId()))
                    .map(MedicineService::normalizeBlankBrandName)
                    .toList();

            repository.saveAll(newMedicines);
        } catch (Exception e) {
            throw new RuntimeException("Error occurred while populating medicines", e);
        }
    }

    @Transactional(readOnly = true)
    public Page<Medicine> getAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<Medicine> search(String query, Pageable pageable) {
        return repository.search(query, pageable);
    }

    @Cacheable(value = "medicines", key = "#id")
    @Transactional(readOnly = true)
    public Medicine getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Medicine not found with id: " + id));
    }

    /**
     * 380 entries in {@code medicines.json} carry {@code "brandName": ""}. Store those as
     * null so no brand is one value rather than an empty string competing with it.
     */
    private static Medicine normalizeBlankBrandName(Medicine medicine) {
        if (medicine.getBrandName() != null && medicine.getBrandName().isBlank()) {
            medicine.setBrandName(null);
        }
        return medicine;
    }
}
