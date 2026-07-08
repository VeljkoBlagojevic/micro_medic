package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.AppointmentRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.PatientRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ScheduledAppointmentRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.security.AccessGuard;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarService {

    public static final int APPOINTMENT_MAX_DURATION_HOURS = 2;
    private final ScheduledAppointmentRepository scheduledAppointmentRepository;
    private final UserService userService;
    private final PatientRepository patientRepository;
    private final AccessGuard accessGuard;

    @Transactional(readOnly = true)
    public Page<ScheduledAppointment> getCalendar(Pageable pageable) {
        User currentUser = userService.getCurrentUser();
        if (currentUser instanceof Patient) {
            accessGuard.requirePatientAccess(currentUser.getId());
            return scheduledAppointmentRepository.findByPatientIdOrderByStartAsc(currentUser.getId(), pageable);
        } else if (currentUser instanceof Doctor) {
            accessGuard.requireSelfDoctor(currentUser.getId());
            return scheduledAppointmentRepository.findByDoctorIdOrderByStartAsc(currentUser.getId(), pageable);
        } else {
            throw new IllegalStateException("Unknown user type: " + currentUser.getClass().getSimpleName());
        }
    }

    @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
    @Transactional
    public ScheduledAppointment createAppointment(AppointmentRequest appointment) {
        if (appointment == null) {
            throw new IllegalArgumentException("Appointment request cannot be null");
        }

        if (appointment.end().isBefore(appointment.start())) {
            throw new IllegalArgumentException("Appointment end time cannot be before start time");
        }

        if (appointment.end().isAfter(appointment.start().plusHours(APPOINTMENT_MAX_DURATION_HOURS))) {
            throw new IllegalArgumentException("Appointment duration cannot exceed " + APPOINTMENT_MAX_DURATION_HOURS + " hours");
        }

        User currentUser = userService.getCurrentUser();
        if (!(currentUser instanceof Doctor doctor)) {
            throw new IllegalStateException("Current user is not a doctor");
        }

        Patient patient = patientRepository.findById(appointment.patientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + appointment.patientId()));

        // TODO: check the existing doctor and patient overlap

        ScheduledAppointment scheduledAppointment = ScheduledAppointment.builder()
                .start(appointment.start())
                .end(appointment.end())
                .doctor(doctor)
                .patient(patient)
                .build();

        log.info("Creating appointment: {}", scheduledAppointment);
        return scheduledAppointmentRepository.save(scheduledAppointment);
    }

    @Transactional(readOnly = true)
    public ScheduledAppointment getById(Long id) {
        accessGuard.requireAppointmentAccess(id);
        return scheduledAppointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Scheduled appointment not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<ScheduledAppointment> getScheduledAppointmentsForADoctor(Long doctorId) {
        accessGuard.requireSelfDoctor(doctorId);
        return scheduledAppointmentRepository.findByDoctorIdOrderByStartAsc(doctorId, Pageable.unpaged()).getContent();
    }

    @Transactional
    public ScheduledAppointment cancel(Long appointmentId) {
        ScheduledAppointment appointment = scheduledAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Scheduled appointment not found with ID: " + appointmentId));

        if (appointment.getStart().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot cancel an appointment that has already started or passed.");
        }

        if (appointment.getDoctor() != null) {
            accessGuard.requireSelfDoctor(appointment.getDoctor().getId());
        } else {
            throw new IllegalStateException("Scheduled appointment does not have an associated doctor.");
        }

        if (appointment.getPatient() != null) {
            accessGuard.requirePatientAccess(appointment.getPatient().getId());
        } else {
            throw new IllegalStateException("Scheduled appointment does not have an associated patient.");
        }

        if (appointment.getStatus() != ScheduledAppointment.Status.SCHEDULED) {
            throw new IllegalArgumentException("Appointment needs to be scheduled so it can be cancelled.");
        }

        appointment.setStatus(ScheduledAppointment.Status.CANCELLED);
        log.info("Cancelling appointment: {} by user: {}", appointment, userService.getCurrentUser().getId());
        return scheduledAppointmentRepository.save(appointment);
    }

    @Transactional
    public ScheduledAppointment reschedule(Long appointmentId, LocalDateTime newStart, LocalDateTime newEnd) {
        accessGuard.requireAppointmentAccess(appointmentId);
        ScheduledAppointment appointment = scheduledAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Scheduled appointment not found with ID: " + appointmentId));

        if (newStart.isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("New start time cannot be in the past.");
        }

        if (newEnd.isBefore(newStart)) {
            throw new IllegalArgumentException("New end time cannot be before the new start time.");
        }

        if (newEnd.isAfter(newStart.plusHours(APPOINTMENT_MAX_DURATION_HOURS))) {
            throw new IllegalArgumentException("New appointment duration cannot exceed " + APPOINTMENT_MAX_DURATION_HOURS + " hours.");
        }

        // TODO: check the existing doctor and patient overlap

        appointment.setStart(newStart);
        appointment.setEnd(newEnd);
        log.info("Rescheduling appointment: {} by user: {}", appointment, userService.getCurrentUser().getId());
        return scheduledAppointmentRepository.save(appointment);
    }


    @Transactional(readOnly = true)
    public Page<ScheduledAppointment> getByPatient(Long patientId, Pageable pageable) {
        accessGuard.requirePatientAccess(patientId);
        return scheduledAppointmentRepository.findByPatientIdOrderByStartAsc(patientId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ScheduledAppointment> getByDoctor(Long doctorId, Pageable pageable) {
        accessGuard.requireSelfDoctor(doctorId);
        return scheduledAppointmentRepository.findByDoctorIdOrderByStartAsc(doctorId, pageable);
    }
}
