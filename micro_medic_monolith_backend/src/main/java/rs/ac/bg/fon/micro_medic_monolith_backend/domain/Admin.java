package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity

@Getter
@Setter
public class Admin extends User {

    public Admin(String firstName, String lastName, String email, String password) {
        super(firstName, lastName, email, password);
    }

    public Admin() {
        super();
    }

    @Override
    public Role getRole() {
        return Role.ADMIN;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
}
