package rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification;

import org.springframework.data.jpa.domain.Specification;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Report;

import java.time.LocalDateTime;

public final class ReportSpecification {

    /**
     * The attribute every date filter here narrows on.
     *
     * <p>{@code creationTime} is {@link Report}'s own timestamp and the one {@code ReportDto}
     * exposes, so it is what a caller filtering by date means. {@code Auditable.createdAt} also
     * exists and is also a {@code LocalDateTime}, which is why filtering the wrong one of the two
     * compiled cleanly and returned plausible-looking results — the dates a client can see came
     * from one column while the filter read another. Named once so the two cannot drift apart
     * again.
     */
    private static final String DATE_ATTRIBUTE = "creationTime";

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
                return criteriaBuilder.between(root.get(DATE_ATTRIBUTE), startDate, endDate);
            } else if (startDate != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get(DATE_ATTRIBUTE), startDate);
            } else {
                return criteriaBuilder.lessThanOrEqualTo(root.get(DATE_ATTRIBUTE), endDate);
            }
        };
    }

    public static Specification<Report> createdAfter(LocalDateTime after) {
        return ((root, query, criteriaBuilder) -> after == null ? null : criteriaBuilder.greaterThanOrEqualTo(root.get(DATE_ATTRIBUTE), after));
    }

    public static Specification<Report> createdBefore(LocalDateTime before) {
        return ((root, query, criteriaBuilder) -> before == null ? null : criteriaBuilder.lessThanOrEqualTo(root.get(DATE_ATTRIBUTE), before));
    }
}
