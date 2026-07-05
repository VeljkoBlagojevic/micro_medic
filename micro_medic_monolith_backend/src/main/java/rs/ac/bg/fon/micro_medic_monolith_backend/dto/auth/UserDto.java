package rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth;

public record UserDto(
        Long id,
        String firstname,
        String lastname,
        String email,
        String role
) {
}
