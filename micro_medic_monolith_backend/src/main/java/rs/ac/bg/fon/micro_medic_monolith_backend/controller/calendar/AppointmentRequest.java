package rs.ac.bg.fon.micro_medic_monolith_backend.controller.calendar;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AppointmentRequest(
        @NotNull(message = "Scheduled appointment must have a start time")
        @Future(message = "Start time must be in the future")
        LocalDateTime start,

        @NotNull(message = "Scheduled appointment must have an end time")
        LocalDateTime end,

        @NotNull(message = "Patient ID can't be null")
        Long patientId) {

}
