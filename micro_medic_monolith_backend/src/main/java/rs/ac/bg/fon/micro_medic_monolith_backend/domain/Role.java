package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {
    ADMIN("ROLE_ADMIN"),
    DOCTOR("ROLE_DOCTOR"),
    NURSE("ROLE_NURSE"),
    PATIENT("ROLE_PATIENT");

    @NotBlank(message = "Authority can't be blank")
    private final String authority;

    Role(String authority) {
        this.authority = authority;
    }

    @Override
    public String getAuthority() {
        return authority;
    }
}
