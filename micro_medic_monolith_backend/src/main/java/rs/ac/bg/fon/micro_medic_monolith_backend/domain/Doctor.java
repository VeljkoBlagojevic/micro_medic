package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.*;

@Entity

@EqualsAndHashCode(callSuper = true)
@Getter
public class Doctor extends User {

    @ManyToOne
    @JoinColumn(name = "specialization_id")
    private SpecializationDepartment specialization;

    @Override
    public Role getRole() {
        return Role.DOCTOR;
    }

    public Doctor(String firstName, String lastName, SpecializationDepartment specialization, String email, String password) {
        super(firstName, lastName, email, password);
        this.specialization = specialization;
    }

    protected Doctor() {
    }

}
