package rs.ac.bg.fon.micro_medic_monolith_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Role;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DoctorStatsDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.PatientStatsDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.StatsService;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.UserService;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;
    private final UserService userService;

    @GetMapping("/me")
    public Object getMyStats() {
        User currentUser = userService.getCurrentUser();
        if (currentUser.getRole() == Role.DOCTOR) {
            return statsService.getDoctorStats(currentUser.getId());
        } else if (currentUser.getRole() == Role.PATIENT) {
            return statsService.getPatientsStats(currentUser.getId());
        } else {
            throw new IllegalArgumentException("Unsupported user role: " + currentUser.getRole());
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public DoctorStatsDto getDoctorStats(@PathVariable Long doctorId) {
        return statsService.getDoctorStats(doctorId);
    }

    @GetMapping("/patient/{patientId}")
    public PatientStatsDto getPatientStats(@PathVariable Long patientId) {
        return statsService.getPatientsStats(patientId);
    }
}
