package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Disease;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Doctor;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.DoctorRepository;

import java.util.List;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public List<Doctor> getAll() {
        return doctorRepository.findAll();
    }

    public Doctor getById(Long id) {
        return doctorRepository.findById(id).orElseThrow(() ->
                new NoSuchElementException("Doctor with id: " + id + " not found"));
    }

}
