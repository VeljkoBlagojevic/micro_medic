package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.ScheduledAppointment;

import java.time.LocalDateTime;

@Repository
public interface ScheduledAppointmentRepository extends JpaRepository<ScheduledAppointment, Long> {

    Page<ScheduledAppointment> findByDoctorIdOrderByStartAsc(Long doctorId, Pageable pageable);
    Page<ScheduledAppointment> findByPatientIdOrderByStartAsc(Long patientId, Pageable pageable);

    boolean existsByDoctorIdAndPatientId(Long doctorId, Long patientId);

    long countByDoctorId(Long doctorId);
    long countByPatientId(Long patientId);

    @Query("""
            SELECT COUNT(sa) FROM ScheduledAppointment sa
            WHERE sa.patient.id = :patientId AND sa.start > :now
            """)
    long countUpcomingByPatientId(@Param("patientId") Long patientId, @Param("now")LocalDateTime now);


}
