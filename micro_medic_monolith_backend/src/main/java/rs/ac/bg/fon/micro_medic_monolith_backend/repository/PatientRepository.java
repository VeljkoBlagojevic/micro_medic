package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Patient;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long>, JpaSpecificationExecutor<Patient> {

    @Query(
        """
        SELECT p FROM Patient p
        WHERE LOWER(p.firstname) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(p.lastname) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(p.email) LIKE LOWER(CONCAT('%', :query, '%'))
        """
    )
    Page<Patient> search(@Param("query") String query, Pageable pageable);
}
