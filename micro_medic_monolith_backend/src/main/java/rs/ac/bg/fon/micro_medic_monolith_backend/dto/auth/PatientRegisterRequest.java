package rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth;

public class PatientRegisterRequest extends RegisterRequest {
    public PatientRegisterRequest(String firstName, String lastName, String email, String password) {
        super(firstName, lastName, email, password);
    }
}
