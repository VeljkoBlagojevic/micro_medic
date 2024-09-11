package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Patient;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.PatientRepository;

import java.util.List;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public List<Patient> getAll() {
        return patientRepository.findAll();
    }

    public Patient getById(Long id) {
        return patientRepository.findById(id).orElseThrow(() ->
                new NoSuchElementException("Patient with id: " + id + " not found"));
    }

}
