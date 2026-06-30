package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Disease;

@Repository
public interface DiseaseRepository extends JpaRepository<Disease, String> {

    @Query(
        """
        SELECT d FROM Disease d
        WHERE LOWER(d.code) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%'))
        """
    )
    Page<Disease> search(@Param("query") String query, Pageable pageable);
}
