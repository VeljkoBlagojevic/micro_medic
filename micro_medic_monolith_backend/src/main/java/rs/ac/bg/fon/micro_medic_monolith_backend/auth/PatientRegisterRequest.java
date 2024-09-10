package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@EqualsAndHashCode
@ToString
public class PatientRegisterRequest extends RegisterRequest {
    public PatientRegisterRequest(String firstname, String lastname, String email, String username, String password) {
        super(firstname, lastname, email, username, password);
    }
}
