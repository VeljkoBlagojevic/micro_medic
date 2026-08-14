package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.SpecializationDepartment;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.EntityNotFoundException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.SpecializationDepartmentRepository;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpecializationService {

    private final SpecializationDepartmentRepository repository;

    @CacheEvict(value = "specializations", allEntries = true)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public void populateSpecializations() {
        ObjectMapper objectMapper = new ObjectMapper();
        try (var inputStream = getClass().getResourceAsStream("/specialization_departments.json")) {
            if (inputStream == null) {
                throw new IllegalArgumentException("Resource /specialization_departments.json not found on the classpath");
            }

            List<SpecializationDepartment> specializations = objectMapper.readValue(inputStream, objectMapper.getTypeFactory().constructCollectionType(List.class, SpecializationDepartment.class));

            List<String> names = specializations.stream().map(SpecializationDepartment::getName).toList();

            Set<String> existing = repository.findByNameIn(names).stream()
                    .map(SpecializationDepartment::getName)
                    .collect(Collectors.toSet());

            List<SpecializationDepartment> missing = specializations.stream()
                    .filter(s -> !existing.contains(s.getName()))
                    .toList();

            repository.saveAll(missing);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Transactional(readOnly = true)
    public Page<SpecializationDepartment> getAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public SpecializationDepartment getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Specialization not found with ID: " + id));
    }
}
