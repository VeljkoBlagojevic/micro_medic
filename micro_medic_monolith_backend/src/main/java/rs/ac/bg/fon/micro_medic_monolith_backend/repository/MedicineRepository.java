package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Medicine;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    @Query("""
            SELECT m FROM Medicine m
            WHERE LOWER(m.brandName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(m.genericName) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    Page<Medicine> search(@Param("query") String query, Pageable pageable);
}
