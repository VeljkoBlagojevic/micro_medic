package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Doctor;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.EntityNotFoundException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.DoctorRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification.DoctorSpecification;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository repository;

    @Transactional(readOnly = true)
    public Page<Doctor> getAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<Doctor> search(String query, Pageable pageable) {
        return repository.search(query, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Doctor> searchFiltered(
            String name, Long specializationId, String specializationName,
            Pageable pageable
    ) {
        Specification<Doctor> spec = Specification.allOf(
                DoctorSpecification.hasNameLike(name),
                DoctorSpecification.hasSpecializationId(specializationId),
                DoctorSpecification.hasSpecializationNameLike(specializationName)
        );

        return repository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Doctor getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found with id: " + id));
    }
}
