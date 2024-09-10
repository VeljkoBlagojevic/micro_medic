package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.Entity;
import lombok.*;

@Entity

@Getter
@Setter
@EqualsAndHashCode
@ToString
public class Patient extends User {

    public Patient() {
    }

    public Patient(Long id, String firstname, String lastname, String email, String username, String password) {
        super(id, firstname, lastname, email, username, password);
    }


    public Patient(String firstname, String lastname, String email, String username, String password) {
        super(firstname, lastname, email, username, password);
    }

    @Override
    public Role getRole() {
        return Role.PATIENT;
    }
}
