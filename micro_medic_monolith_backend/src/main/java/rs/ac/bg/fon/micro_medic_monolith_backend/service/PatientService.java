package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Patient;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.EntityNotFoundException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.PatientRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.security.AccessGuard;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository repository;
    private final AccessGuard accessGuard;

    @PreAuthorize("hasRole('ROLE_DOCTOR') or hasRole('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public Page<Patient> listPatients(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @PreAuthorize("hasRole('ROLE_DOCTOR') or hasRole('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public Page<Patient> searchPatients(String query, Pageable pageable) {
        return repository.search(query, pageable);
    }

    @Transactional(readOnly = true)
    public Patient getById(Long id) {
        accessGuard.requirePatientAccess(id);
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with id: " + id));
    }

}
