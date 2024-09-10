package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import com.google.common.base.Preconditions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.controller.calendar.ZakazivanjeRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Doctor;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Patient;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.ScheduledAppointment;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.PatientRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.ScheduledAppointmentRepository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {

    public static final int TERMIN_MAX_DURATION_HOURS = 2;
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

    public ScheduledAppointment zakaziTermin(ZakazivanjeRequest termin) {
        Preconditions.checkNotNull(termin, "Termin ne sme biti prazan");
        Preconditions.checkNotNull(termin.start(), "Zakazani termin mora imati start");
        Preconditions.checkNotNull(termin.end(), "Zakazani termin mora imati end");
        Preconditions.checkArgument(termin.start().isBefore(termin.end()), "start mora biti pre enda termina");
        Preconditions.checkArgument(termin.start().isAfter(LocalDateTime.now()));
        Preconditions.checkArgument(termin.start().plusHours(TERMIN_MAX_DURATION_HOURS).isAfter(termin.end()), "Termin ne sme trajati duze od 2h");

        User currentUser = userService.getCurrentUser();
        if (!(currentUser instanceof Doctor doctor)) {
            throw new UnsupportedOperationException("Not a Doctor");
        }
        var terminiDoktora =  scheduledAppointmentRepository.findByDoctorId(currentUser.getId());

        if(terminiDoktora.stream().anyMatch(t -> t.getStart().isBefore(termin.end()) && t.getEnd().isAfter(termin.start()))) {
            throw new IllegalArgumentException("Termin se preklapa");
        }

        Patient patient = patientRepository.findById(termin.patientId()).orElseThrow(() -> new IllegalArgumentException("Nije pronadjen pacijent"));

        ScheduledAppointment scheduledAppointment = ScheduledAppointment.builder()
                .start(termin.start())
                .end(termin.end())
                .doctor(doctor)
                .patient(patient)
                .build();

        return scheduledAppointmentRepository.save(scheduledAppointment);
    }
}
