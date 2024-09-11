package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import com.google.common.base.Preconditions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.controller.calendar.AppointmentRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Doctor;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Patient;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.ScheduledAppointment;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.PatientRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ScheduledAppointmentRepository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CalendarService {

    public static final int APPOINTMENT_MAX_DURATION_HOURS = 2;
    private final ScheduledAppointmentRepository scheduledAppointmentRepository;
    private final UserService userService;
    private final PatientRepository patientRepository;

    public List<ScheduledAppointment> getCalendar() {
        User currentUser = userService.getCurrentUser();
        if (currentUser instanceof Doctor) {
            var list =  scheduledAppointmentRepository.findByDoctorId(currentUser.getId());
            Collections.sort(list);
            return list;
        }
        if (currentUser instanceof Patient) {
            var list =  scheduledAppointmentRepository.findByPatientId(currentUser.getId());
            Collections.sort(list);
            return list;
        }
        return Collections.emptyList();
    }

    public ScheduledAppointment createAppointment(AppointmentRequest appointment) {
        if (appointment == null) {
            throw new IllegalArgumentException("Appointment cannot be null");
        }

        if (appointment.start().isAfter(appointment.end())) {
            throw new IllegalArgumentException("Start time must be before the end time");
        }

        if (appointment.start().plusHours(APPOINTMENT_MAX_DURATION_HOURS).isBefore(appointment.end())) {
            throw new IllegalArgumentException("Appointment cannot last longer than " + APPOINTMENT_MAX_DURATION_HOURS + " hours");
        }
//        Preconditions.checkArgument(appointment.start().isBefore(appointment.end()), "Start time must be before the end time");
//        Preconditions.checkArgument(appointment.start().plusHours(APPOINTMENT_MAX_DURATION_HOURS).isAfter(appointment.end()), "Termin ne sme trajati duze od 2h");

        User currentUser = userService.getCurrentUser();
        if (!(currentUser instanceof Doctor doctor)) {
            throw new UnsupportedOperationException("Not a Doctor");
        }
        var doctorsAppointments =  scheduledAppointmentRepository.findByDoctorId(currentUser.getId());

        if(doctorsAppointments.stream().anyMatch(t -> t.getStart().isBefore(appointment.end()) && t.getEnd().isAfter(appointment.start()))) {
            throw new IllegalArgumentException("Appointment overlaps");
        }

        Patient patient = patientRepository.findById(appointment.patientId()).orElseThrow(() -> new IllegalArgumentException("Nije pronadjen pacijent"));

        ScheduledAppointment scheduledAppointment = ScheduledAppointment.builder()
                .start(appointment.start())
                .end(appointment.end())
                .doctor(doctor)
                .patient(patient)
                .build();

        return scheduledAppointmentRepository.save(scheduledAppointment);
    }

    public ScheduledAppointment getById(Long id) {
        return scheduledAppointmentRepository.findById(id).orElseThrow(() ->
                new NoSuchElementException("Appointment with id: " + id + " not found"));
    }

    public List<ScheduledAppointment> getByPatiendId(Long patiendId) {
        return scheduledAppointmentRepository.findByPatientId(patiendId);
    }

    public List<ScheduledAppointment> getByDoctorId(Long doctorId) {
        return scheduledAppointmentRepository.findByDoctorId(doctorId);
    }
}
