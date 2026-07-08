package rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank
        String currentPassword,

        @NotBlank
        @Size(min = 8, message = "New password must be at least 8 characters long")
        String newPassword,

        @NotBlank
        String confirmPassword
) {
}
