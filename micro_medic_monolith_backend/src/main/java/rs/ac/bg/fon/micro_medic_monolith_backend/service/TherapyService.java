package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Therapy;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.EntityNotFoundException;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.security.AccessGuard;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.TherapyRepository;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TherapyService {

    private final TherapyRepository repository;
    private final AccessGuard accessGuard;

    /**
     * System-wide therapy listing. Restricted to ADMIN because it is not scoped to a  
     * single patient and therefore cannot be authorised per-row by {@link AccessGuard}.
     */
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public Page<Therapy> getAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Therapy getById(Long id) {
        Therapy therapy = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Therapy not found with ID: " + id));
        accessGuard.requireExaminationAccess(therapy.getExamination().getId());
        return therapy;
    }

    /**
     * Unguarded on purpose: only called from services that have already authorised the  
     * surrounding examination or patient. Do not expose directly from a controller.
     */
    @Transactional(readOnly = true)
    public Optional<Therapy> getByExaminationId(Long examinationId) {
        return repository.findById(examinationId);
    }
}