package rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification;

import org.springframework.data.jpa.domain.Specification;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Report;

import java.time.LocalDateTime;

public final class ReportSpecification {

    private ReportSpecification() {
    }

    public static Specification<Report> hasPatientId(Long patientId) {
        return (root, query, criteriaBuilder) -> patientId == null ? null : criteriaBuilder.equal(root.get("examination").get("scheduledAppointment").get("patient").get("id"), patientId);
    }

    public static Specification<Report> hasGeneratedBy(Long userId) {
        return (root, query, criteriaBuilder) -> userId == null ? null : criteriaBuilder.equal(root.get("generatedBy").get("id"), userId);
    }

    public static Specification<Report> hasType(Report.Type reportType) {
        return (root, query, criteriaBuilder) -> {
            if (reportType == null) return null;
            return criteriaBuilder.equal(root.get("type"), reportType);
        };
    }

    public static Specification<Report> hasDateBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return (root, query, criteriaBuilder) -> {
            if (startDate == null && endDate == null) return null;
            if (startDate != null && endDate != null) {
                return criteriaBuilder.between(root.get("creationTime"), startDate, endDate);
            } else if (startDate != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get("creationTime"), startDate);
            } else {
                return criteriaBuilder.lessThanOrEqualTo(root.get("creationTime"), endDate);
            }
        };
    }

    public static Specification<Report> createdAfter(LocalDateTime after) {
        return ((root, query, criteriaBuilder) -> after == null ? null : criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), after));
    }

    public static Specification<Report> createdBefore(LocalDateTime before) {
        return ((root, query, criteriaBuilder) -> before == null ? null : criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), before));
    }
}
