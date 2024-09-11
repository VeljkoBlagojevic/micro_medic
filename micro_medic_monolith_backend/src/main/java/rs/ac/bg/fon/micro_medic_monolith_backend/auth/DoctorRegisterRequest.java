package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import lombok.*;

@Getter
@Setter
@EqualsAndHashCode
@ToString
public class DoctorRegisterRequest extends RegisterRequest {
    private Long specializationId;

    public DoctorRegisterRequest(String firstname, String lastname, String email, String username, String password, Long specializationId) {
        super(firstname, lastname, email, username, password);
        this.specializationId = specializationId;
    }
}
