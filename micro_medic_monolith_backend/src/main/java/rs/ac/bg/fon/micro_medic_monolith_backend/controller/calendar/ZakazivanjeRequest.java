package rs.ac.bg.fon.micro_medic_monolith_backend.controller.calendar;

import java.time.LocalDateTime;

public record ZakazivanjeRequest(
        LocalDateTime start,
        LocalDateTime end,
        Long patientId) {
}
