package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Therapy;

@Repository
public interface TherapyRepository extends JpaRepository<Therapy, Long> {
}
