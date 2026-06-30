package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity

@Data
@EqualsAndHashCode(callSuper = true)
public class Doctor extends User {

    @ManyToOne
    @JoinColumn(name = "specialization_id")
    private SpecializationDepartment specialization;

    @Override
    public Role getRole() {
        return Role.DOCTOR;
    }

}
