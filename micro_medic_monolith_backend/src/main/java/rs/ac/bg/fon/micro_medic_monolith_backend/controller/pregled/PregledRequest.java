package rs.ac.bg.fon.micro_medic_monolith_backend.controller.pregled;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

public record PregledRequest(
        @NotBlank
        LocalDateTime start,
        @NotBlank
        String anamneza,
        @NotBlank
        String dijagnozaCode,
        @NotBlank
        String opisTerapije,
        List<MedicineUsageRequest> primenaMedicineova) { }
