package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.Entity;
import lombok.EqualsAndHashCode;

@Entity

@EqualsAndHashCode(callSuper = true)
public class Patient extends User {

    @Override
    public Role getRole() {
        return Role.PATIENT;
    }

    public Patient(String firstName, String lastName, String email, String password) {
        super(firstName, lastName, email, password);
    }
}
