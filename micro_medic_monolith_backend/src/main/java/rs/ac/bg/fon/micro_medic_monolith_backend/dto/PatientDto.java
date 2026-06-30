package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PatientDto(
        Long id,

        @NotBlank(message = "First name can't be blank")
        String firstname,

        @NotBlank(message = "Last name can't be blank")
        String lastname,

        @NotBlank
        @Email
        String email,

        @NotBlank(message = "Username can't be blank")
        String username) {
}
