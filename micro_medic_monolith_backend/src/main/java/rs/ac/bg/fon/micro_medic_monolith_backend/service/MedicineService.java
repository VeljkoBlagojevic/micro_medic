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
        try (InputStream inputStream = TypeReference.class.getResourceAsStream("/medicines.json")) {
            List<Medicine> medicines = objectMapper.readValue(inputStream, new TypeReference<List<Medicine>>() {
            });

            List<Long> ids = medicines.stream().map(Medicine::getId).toList();

            Set<Long> existingIds = repository.findAllById(ids).stream()
                    .map(Medicine::getId)
                    .collect(Collectors.toSet());

            List<Medicine> newMedicines = ids.stream()
                    .filter(id -> !existingIds.contains(id))
                    .map(id -> medicines.stream().filter(medicine -> medicine.getId().equals(id)).findFirst().orElseThrow())
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
}
