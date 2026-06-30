package rs.ac.bg.fon.micro_medic_monolith_backend.repository.specification;

import org.springframework.data.jpa.domain.Specification;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Patient;

public final class PatientSpecification {

    private PatientSpecification() {
        // Private constructor to prevent instantiation
    }

    public static Specification<Patient> hasNameLike(String name) {
        return (root, query, cb) -> {
            if (name == null || name.isBlank()) return null;
            String pattern = "%" + name.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("firstname")), pattern),
                    cb.like(cb.lower(root.get("lastname")), pattern)
            );
        };
    }

    public static Specification<Patient> hasEmailLike(String email) {
        return (root, query, cb) -> {
            if (email == null || email.isBlank()) return null;
            String pattern = "%" + email.toLowerCase() + "%";
            return cb.like(cb.lower(root.get("email")), pattern);
        };
    }
}
