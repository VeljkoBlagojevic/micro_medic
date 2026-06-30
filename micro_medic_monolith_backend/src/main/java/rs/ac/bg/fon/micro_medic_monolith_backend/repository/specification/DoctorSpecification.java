package rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification;

import org.springframework.data.jpa.domain.Specification;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Doctor;

public final class DoctorSpecification {

    private DoctorSpecification() {
        // Private constructor to prevent instantiation
    }

    public static Specification<Doctor> hasNameLike(String name) {
        return (root, query, cb) -> {
            if (name == null || name.isBlank()) return null;
            String pattern = "%" + name.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("firstname")), pattern),
                    cb.like(cb.lower(root.get("lastname")), pattern)
            );
        };
    }

    public static Specification<Doctor> hasSpecializationId(Long specializationId) {
        return (root, query, cb) -> {
            if (specializationId == null) return null;
            return cb.equal(root.get("specialization").get("id"), specializationId);
        };
    }

    public static Specification<Doctor> hasSpecializationNameLike(String specializationName) {
        return (root, query, cb) -> {
            if (specializationName == null || specializationName.isBlank()) return null;
            String pattern = "%" + specializationName.toLowerCase() + "%";
            return cb.like(cb.lower(root.get("specialization").get("name")), pattern);
        };
    }
}
