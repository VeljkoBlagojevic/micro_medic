package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.ScheduledAppointment;

import java.util.List;

@Repository
public interface ScheduledAppointmentRepository extends JpaRepository<ScheduledAppointment, Long> {
    List<ScheduledAppointment> findByDoctorId(Long id);

    List<ScheduledAppointment> findByPatientId(Long id);
}
