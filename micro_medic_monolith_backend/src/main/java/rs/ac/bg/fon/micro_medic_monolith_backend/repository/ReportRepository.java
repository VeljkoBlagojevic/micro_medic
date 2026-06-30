package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Report;

import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    Optional<Report> findByExaminationId(Long examinationId);

    Page<Report> findByGeneratedById(Long generatedById, Pageable pageable);

    Page<Report> findByExaminationScheduledAppointmentPatientId(Long patientId, Pageable pageable);
}
