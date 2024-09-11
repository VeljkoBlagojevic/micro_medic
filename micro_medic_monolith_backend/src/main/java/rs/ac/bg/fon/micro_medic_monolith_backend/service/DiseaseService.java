package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.controller.DiseaseController;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Disease;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.DiseaseRepository;

import java.io.InputStream;
import java.util.List;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class DiseaseService {

    private final DiseaseRepository diseaseRepository;

    public void populateDiseases() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        InputStream inputStream = TypeReference.class.getResourceAsStream("/icd10_codes.json");

        List<Disease> diseases = objectMapper.readValue(inputStream, new TypeReference<List<Disease>>() {});

        diseaseRepository.saveAll(diseases);
    }

    public List<Disease> getAll() {
        return diseaseRepository.findAll();
    }

    public Disease getById(String id) {
        return diseaseRepository.findById(id).orElseThrow(() ->
                new NoSuchElementException("Disease with id: " + id + " not found"));
    }
}
