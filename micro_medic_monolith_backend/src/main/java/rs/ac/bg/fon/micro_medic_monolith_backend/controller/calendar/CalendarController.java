package rs.ac.bg.fon.micro_medic_monolith_backend.controller.calendar;


import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.ScheduledAppointment;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.CalendarService;

import java.util.List;

@RestController
@RequestMapping("calendar")
@RequiredArgsConstructor
@CrossOrigin
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping
    public List<ScheduledAppointment> getCalendar() {
        return calendarService.getCalendar();
    }

    @PostMapping
    public ScheduledAppointment zakaziTermin(@RequestBody ZakazivanjeRequest termin) {
        return calendarService.zakaziTermin(termin);
    }

}
