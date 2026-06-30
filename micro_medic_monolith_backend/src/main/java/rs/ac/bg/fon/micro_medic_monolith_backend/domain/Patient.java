package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity

@Data
@EqualsAndHashCode(callSuper = true)
public class Patient extends User {

    @Override
    public Role getRole() {
        return Role.PATIENT;
    }
}
