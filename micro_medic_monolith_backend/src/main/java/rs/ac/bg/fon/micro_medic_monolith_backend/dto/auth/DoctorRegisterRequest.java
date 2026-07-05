package rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth;

import lombok.EqualsAndHashCode;
import lombok.Getter;

@Getter
@EqualsAndHashCode(callSuper = true)
public class DoctorRegisterRequest extends RegisterRequest {
    private final Long specializationId;

    public DoctorRegisterRequest(String firstName, String lastName, String email, String password, Long specializationId) {
        super(firstName, lastName, email, password);
        this.specializationId = specializationId;
    }

}
