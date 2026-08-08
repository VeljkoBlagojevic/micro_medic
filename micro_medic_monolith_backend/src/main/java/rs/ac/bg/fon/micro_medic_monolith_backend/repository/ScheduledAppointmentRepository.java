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

/**
 * True when the doctor or the patient already has a SCHEDULED appointment overlapping
 * [start, end). Half-open on purpose: back-to-back slots do not overlap.
 * Pass {@code excludedId = null} when creating, or the appointment's own id when rescheduling.
 */
@Query("""
            SELECT COUNT(sa) > 0 FROM ScheduledAppointment sa
            WHERE sa.status = :status
            AND (sa.doctor.id = :doctorId OR sa.patient.id = :patientId)
            AND sa.start < :end AND sa.end > :start
            AND (:excludedId IS NULL OR sa.id <> :excludedId)
            """)
    boolean existsOverlapping(@Param("doctorId") Long doctorId,
                              @Param("patientId") Long patientId,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end,
                              @Param("excludedId") Long excludedId,
                              @Param("status") ScheduledAppointment.Status status);

}


