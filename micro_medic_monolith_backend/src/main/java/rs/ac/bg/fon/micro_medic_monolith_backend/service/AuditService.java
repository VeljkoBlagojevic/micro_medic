package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.MedicalAccessLog;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.MedicalAccessLogRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification.MedicalAccessLogSpecification;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private MedicalAccessLogRepository medicalAccessLogRepository;

    @Transactional(readOnly = true)
    public Page<MedicalAccessLog> getAllAccessLogs(
            Long patientId, Long accessorId,
            MedicalAccessLog.AccessedResourceType accessedResourceType,
            LocalDateTime from, LocalDateTime to,
            Pageable pageable) {
        Specification<MedicalAccessLog> spec = Specification.allOf(
                MedicalAccessLogSpecification.hasPatientId(patientId),
                MedicalAccessLogSpecification.hasAccessorId(accessorId),
                MedicalAccessLogSpecification.hasResourceType(accessedResourceType),
                MedicalAccessLogSpecification.accessedAfter(from),
                MedicalAccessLogSpecification.accessedBefore(to)
        );

        return medicalAccessLogRepository.findAll(spec, pageable);
    }

}
