package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.AppointmentRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.ScheduledAppointmentDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.CalendarService;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping
    public Page<ScheduledAppointmentDto> getScheduledAppointments(@PageableDefault(size = 10) Pageable pageable) {
        return calendarService.getCalendar(pageable)
                .map(DtoMapper::toScheduledAppointmentDto);
    }

    @PostMapping
    public ScheduledAppointmentDto createScheduledAppointment(@RequestBody @Valid AppointmentRequest appointmentDto) {
        return DtoMapper.toScheduledAppointmentDto(calendarService.createAppointment(appointmentDto));
    }

    @GetMapping("/{id}")
    public ScheduledAppointmentDto getScheduledAppointment(@PathVariable Long id) {
        return DtoMapper.toScheduledAppointmentDto(calendarService.getById(id));
    }

    @GetMapping("/patient/{patientId}")
    public Page<ScheduledAppointmentDto> getScheduledAppointmentsForPatient(@PathVariable Long patientId, @PageableDefault(size = 10) Pageable pageable) {
        return calendarService.getByPatient(patientId, pageable)
                .map(DtoMapper::toScheduledAppointmentDto);
    }

    @GetMapping("/doctor/{doctorId}")
    public Page<ScheduledAppointmentDto> getScheduledAppointmentsForDoctor(@PathVariable Long doctorId, @PageableDefault(size = 10) Pageable pageable) {
        return calendarService.getByDoctor(doctorId, pageable)
                .map(DtoMapper::toScheduledAppointmentDto);
    }

    @PutMapping("/{id}/cancel")
    public ScheduledAppointmentDto cancelScheduledAppointment(@PathVariable Long id) {
        return DtoMapper.toScheduledAppointmentDto(calendarService.cancel(id));
    }

    @PutMapping("/{id}/reschedule")
    public ScheduledAppointmentDto rescheduleScheduledAppointment(@PathVariable Long id, @RequestBody @Valid AppointmentRequest appointmentDto) {
        return DtoMapper.toScheduledAppointmentDto(calendarService.reschedule(id, appointmentDto.start(), appointmentDto.end()));
    }
}
