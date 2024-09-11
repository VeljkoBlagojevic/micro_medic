package rs.ac.bg.fon.micro_medic_monolith_backend.controller.calendar;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.ScheduledAppointment;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.CalendarService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
@CrossOrigin
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping
    public List<ScheduledAppointment> getCalendar() {
        return calendarService.getCalendar();
    }

    @PostMapping
    public ScheduledAppointment createAppointment (@RequestBody @Valid AppointmentRequest appointment) {
        return calendarService.createAppointment (appointment);
    }

    @GetMapping("/{id}")
    public ScheduledAppointment getScheduledAppointmentById(@PathVariable Long id) {
        return calendarService.getById(id);
    }

    @GetMapping("/{patientId}/patient")
    public List<ScheduledAppointment> getScheduledAppointmentByPatientId(@PathVariable Long patientId) {
        return calendarService.getByPatiendId(patientId);
    }

    @GetMapping("/{doctorId}/doctor")
    public List<ScheduledAppointment> getScheduledAppointmentByDoctorId(@PathVariable Long doctorId) {
        return calendarService.getByPatiendId(doctorId);
    }
}
