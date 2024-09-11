package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Medicine;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.MedicineRepository;

import java.io.InputStream;
import java.util.List;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;

    public void populateMedicines() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        InputStream inputStream = TypeReference.class.getResourceAsStream("/medicines.json");

        List<Medicine> medicines = objectMapper.readValue(inputStream, new TypeReference<List<Medicine>>() {});

        medicineRepository.saveAll(medicines);
    }

    public List<Medicine> getAll() {
        return medicineRepository.findAll();
    }

    public Medicine getById(Long id) {
        return medicineRepository.findById(id).orElseThrow(() ->
                new NoSuchElementException("Medicine with id: " + id + " not found"));
    }
}
