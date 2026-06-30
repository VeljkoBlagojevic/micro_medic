package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Therapy;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.EntityNotFoundException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.TherapyRepository;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TherapyService {

    private final TherapyRepository repository;

    @Transactional(readOnly = true)
    public Page<Therapy> getAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Therapy getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Therapy not found with ID: " + id));
    }

    @Transactional
    public Optional<Therapy> getByExaminationId(Long examinationId) {
        return repository.findByExaminationId(examinationId);
    }
}
