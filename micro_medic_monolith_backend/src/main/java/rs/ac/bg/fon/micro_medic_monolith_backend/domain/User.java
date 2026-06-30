package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.annotations.NaturalId;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)

@Data
public abstract class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name can't be blank")
    private String firstname;

    @NotBlank(message = "Last name can't be blank")
    private String lastname;

    @NaturalId
    @NotBlank
    @Email
    private String email;

    @NaturalId
    @NotBlank
    private String username;

    @JsonIgnore
    @NotBlank
    private String password;

    @Override
    @NullMarked
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(getRole());
    }

    public abstract Role getRole();

    @Override
    @NullMarked
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return false;
    }
}
