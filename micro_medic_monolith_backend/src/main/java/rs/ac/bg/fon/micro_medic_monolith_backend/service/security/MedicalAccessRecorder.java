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
     * Records access log with REQUIRES_NEW propagation so it writes independently
     * of callers marked @Transactional(readOnly=true) which would otherwise use FlushMode.MANUAL.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
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
