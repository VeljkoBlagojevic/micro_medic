package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Patient;

@Repository
public interface PatientRepository extends UserRepository<Patient> {
}
