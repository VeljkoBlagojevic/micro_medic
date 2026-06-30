package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import rs.ac.bg.fon.micro_medic_monolith_backend.validation.ValidDateRange;

import java.time.LocalDateTime;

@ValidDateRange(
        startField = "start",
        endField = "end",
        message = "Start date must be before end date")
public record AppointmentRequest(

        @NotNull
        @Future(message = "Start date must be in the future")
        LocalDateTime start,

        @NotNull
        @Future(message = "End date must be in the future")
        LocalDateTime end,

        @NotNull
        Long patientId
) {
}
