package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Therapy;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.TherapyRepository;

import java.util.List;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class TherapyService {

    private final TherapyRepository therapyRepository;

    public List<Therapy> getAll() {
        return therapyRepository.findAll();
    }

    public Therapy getById(Long id) {
        return therapyRepository.findById(id).orElseThrow(() ->
                new NoSuchElementException("Therapy with id: " + id + " not found"));
    }

}
