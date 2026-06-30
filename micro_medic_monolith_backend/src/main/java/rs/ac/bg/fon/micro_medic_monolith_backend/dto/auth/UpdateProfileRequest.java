package rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank
        String firstname,

        @NotBlank
        String lastname,

        @NotBlank
        @Email
        String email
) {
}
