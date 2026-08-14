package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import rs.ac.bg.fon.micro_medic_monolith_backend.exception.EntityNotFoundException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Disease;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.DiseaseRepository;

import java.io.InputStream;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiseaseService {

    private final DiseaseRepository diseaseRepository;

    @CacheEvict(value = "diseases", allEntries = true)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public void populateDiseases() {
        ObjectMapper objectMapper = new ObjectMapper();
        try (InputStream inputStream = getClass().getResourceAsStream("/icd10_codes.json")) {
            if (inputStream == null) {
                throw new IllegalArgumentException("Resource /icd10_codes.json not found on the classpath");
            }

            List<Disease> diseases = objectMapper.readValue(inputStream, new TypeReference<List<Disease>>() {});

            Set<String> existingCodes = diseaseRepository.findAllById(diseases.stream().map(Disease::getCode).toList()).stream()
                    .map(Disease::getCode)
                    .collect(Collectors.toSet());
            List<Disease> newDiseases = diseases.stream()
                    .filter(disease -> !existingCodes.contains(disease.getCode()))
                    .toList();

            diseaseRepository.saveAll(newDiseases);
        } catch (Exception e) {
            throw new RuntimeException("Error occurred while populating diseases", e);
        }
    }

    @Transactional(readOnly = true)
    public Page<Disease> getDiseases(Pageable pageable) {
        return diseaseRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<Disease> search(String query, Pageable pageable) {
        return diseaseRepository.search(query, pageable);
    }

    @Cacheable(value = "diseases", key = "#id")
    public Disease getById(String id) {
        return diseaseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Disease not found with ID: " + id));
    }
}
