package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity

@Getter
@Setter
@EqualsAndHashCode
@ToString
public class Doctor extends User {

    @ManyToOne
    @JoinColumn(name = "specialization_id")
    private SpecializationDepartment specialization;

    public Doctor() {
    }

    public Doctor(Long id, String firstname, String lastname, String email, String username, String password, SpecializationDepartment specialization) {
        super(id, firstname, lastname, email, username, password);
        this.specialization = specialization;
    }

    public Doctor(String firstname, String lastname, String email, String username, String password, SpecializationDepartment specialization) {
        super(firstname, lastname, email, username, password);
        this.specialization = specialization;
    }

    @Override
    public Role getRole() {
        return Role.DOCTOR;
    }
}
