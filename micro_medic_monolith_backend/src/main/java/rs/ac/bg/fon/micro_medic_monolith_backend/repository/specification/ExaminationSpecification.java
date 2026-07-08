package rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification;

import org.springframework.data.jpa.domain.Specification;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Examination;

import java.time.LocalDateTime;

public final class ExaminationSpecification {

    private ExaminationSpecification() {
        // Private constructor to prevent instantiation
    }

    public static Specification<Examination> hasStatus(Examination.Status status) {
        return (root, query, criteriaBuilder) -> status == null ? null : criteriaBuilder.equal(root.get("status"), status);
    }

    public static Specification<Examination> hasPatientId(Long patientId) {
        return (root, query, criteriaBuilder) -> patientId == null ? null : criteriaBuilder.equal(root.get("patient").get("id"), patientId);
    }

    public static Specification<Examination> hasDoctorId(Long doctorId) {
        return (root, query, criteriaBuilder) -> doctorId == null ? null : criteriaBuilder.equal(root.get("doctor").get("id"), doctorId);
    }

    public static Specification<Examination> hasDiagnosisCode(String diagnosisCode) {
        return (root, query, criteriaBuilder) -> diagnosisCode == null ? null : criteriaBuilder.equal(root.get("diagnosis").get("code"), diagnosisCode);
    }

    public static Specification<Examination> startedAfter(LocalDateTime after) {
        return (root, query, criteriaBuilder) -> after == null ? null : criteriaBuilder.greaterThan(root.get("startTime"), after);
    }

    public static Specification<Examination> startedBefore(LocalDateTime before) {
        return (root, query, criteriaBuilder) -> before == null ? null : criteriaBuilder.lessThan(root.get("startTime"), before);
    }
}
