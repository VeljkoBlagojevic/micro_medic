package rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification;

import org.springframework.data.jpa.domain.Specification;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.MedicalAccessLog;

import java.time.LocalDateTime;

public final class MedicalAccessLogSpecification {

    private MedicalAccessLogSpecification() {
        // Private constructor to prevent instantiation
    }

    public static Specification<MedicalAccessLog> hasPatientId(Long patientId) {
        return (root, query, criteriaBuilder) -> patientId == null ? null : criteriaBuilder.equal(root.get("patientId"), patientId);
    }

    public static Specification<MedicalAccessLog> hasAccessorId(Long accessorId) {
        return (root, query, criteriaBuilder) -> accessorId == null ? null : criteriaBuilder.equal(root.get("accessorId"), accessorId);
    }

    public static Specification<MedicalAccessLog> hasResourceType(MedicalAccessLog.AccessedResourceType resourceType) {
        return (root, query, criteriaBuilder) -> resourceType == null ? null : criteriaBuilder.equal(root.get("resourceType"), resourceType);
    }

    public static Specification<MedicalAccessLog> accessedAfter(LocalDateTime after) {
        return (root, query, criteriaBuilder) -> after == null ? null : criteriaBuilder.greaterThanOrEqualTo(root.get("accessedAt"), after);
    }

    public static Specification<MedicalAccessLog> accessedBefore(LocalDateTime before) {
        return (root, query, criteriaBuilder) -> before == null ? null : criteriaBuilder.lessThanOrEqualTo(root.get("accessedAt"), before);
    }
}
