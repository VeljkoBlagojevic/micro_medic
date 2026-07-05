package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Doctor;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long>, JpaSpecificationExecutor<Doctor> {

    @Query("""
            SELECT d FROM Doctor d
            WHERE LOWER(d.firstname) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(d.lastname) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(d.specialization.name) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    Page<Doctor> search(
            @Param("query") String query,
            Pageable pageable
    );
}
