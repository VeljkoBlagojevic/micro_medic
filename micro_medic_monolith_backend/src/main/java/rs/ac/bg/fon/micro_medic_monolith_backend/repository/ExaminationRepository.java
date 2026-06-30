package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Examination;

import java.util.Optional;

@Repository
public interface ExaminationRepository extends JpaRepository<Examination, Long>, JpaSpecificationExecutor<Examination> {

    @Query("""
            SELECT e FROM Examination e
            WHERE e.scheduledAppointment.patient.id = :patientId
            ORDER BY e.start DESC
            """)
    Page<Examination> findByPatientId(@Param("patientId") Long patientId, Pageable pageable);

    @Query("""
            SELECT e FROM Examination e
            WHERE e.scheduledAppointment.doctor.id = :doctorId
            ORDER BY e.start DESC
            """)
    Page<Examination> findByDoctorId(@Param("doctorId") Long doctorId, Pageable pageable);

    Optional<Examination> findByScheduledAppointmentId(Long scheduledAppointmentId);

    @Query("""
            SELECT COUNT(e) FROM Examination e
            WHERE e.scheduledAppointment.doctor.id = :doctorId
            """)
    long countByDoctorId(@Param("doctorId") Long doctorId);

    @Query("""    
            SELECT COUNT(e) FROM Examination e
            WHERE e.scheduledAppointment.patient.id = :patientId
            """)
    long countByPatientId(@Param("patientId") Long patientId);

    @Query("""
            SELECT COUNT(DISTINCT e.scheduledAppointment.patient.id) FROM Examination e
            WHERE e.scheduledAppointment.doctor.id = :doctorId
            """)
    long countDistinctPatientsByDoctorId(@Param("doctorId") Long doctorId);

    @Query("""
            SELECT COUNT(DISTINCT e.scheduledAppointment.doctor.id) FROM Examination e
            WHERE e.scheduledAppointment.patient.id = :patientId
            """)
    long countDistinctDoctorsByPatientId(@Param("patientId") Long patientId);
}
