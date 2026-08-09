package rs.ac.bg.fon.micro_medic_monolith_backend.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.MedicalAccessLogRepository;

/**
 * Writes {@link MedicalAccessLog} rows in their own transaction.
 */
@Service
@RequiredArgsConstructor
public class MedicalAccessRecorder {
    private final MedicalAccessLogRepository medicalAccessLogRepository;

    /**
     * Writes the audit row in its own transaction.
     *
     * <p>{@code REQUIRES_NEW} is required, not defensive: most callers of {@link AccessGuard} are
     * read paths annotated {@code @Transactional(readOnly = true)}, and Spring sets the Hibernate
     * session's flush mode to {@code MANUAL} for those. Joining such a transaction (the default
     * {@code REQUIRED}) leaves the row in the persistence context and never issues the INSERT —
     * the access silently goes unaudited.
     *
     * <p>Correspondingly this method must <b>not</b> be {@code readOnly}. That flag is what sets
     * {@code FlushMode.MANUAL} in the first place, so marking the new transaction read-only
     * reproduces the bug it exists to avoid, one transaction further down.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(MedicalAccessLog.AccessedResourceType resourceType, Long resourceId, Long patientId, User accessor) {
        MedicalAccessLog log = MedicalAccessLog.builder()
                .accessorId(accessor.getId())
                .accessorRole(accessor.getRole() != null ? accessor.getRole().name() : null)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .patientId(patientId)
                .accessedAt(java.time.LocalDateTime.now())
                .build();
        medicalAccessLogRepository.save(log);
    }

}
