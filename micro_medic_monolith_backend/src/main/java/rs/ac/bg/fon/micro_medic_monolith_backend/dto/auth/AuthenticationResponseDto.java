package rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth;

public record AuthenticationResponseDto(
        String token,
        UserDto user
) {
}
