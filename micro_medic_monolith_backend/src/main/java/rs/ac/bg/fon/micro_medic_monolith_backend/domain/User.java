package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.NaturalId;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)

@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode
@ToString
public abstract class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @NotBlank(message = "First name can't be blank")
    private String firstname;

    @NotBlank(message = "Last name can't be blank")
    private String lastname;

    @NaturalId
    @NotBlank(message = "Email can't be blank")
    @Email(message = "Email should be valid")
    private String email;

    @NaturalId
    @NotBlank(message = "Username can't be blank")
    private String username;

    @JsonIgnore
    @NotBlank(message = "Password can't be blank")
    private String password;

    protected User(Long id, String firstname, String lastname, String email, String username, String password) {
        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.username = username;
        this.password = password;
    }

    protected User(String firstname, String lastname, String email, String username, String password) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.username = username;
        this.password = password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(getRole());
    }

    // Abstract method to enforce that subclasses must implement their specific role
    public abstract Role getRole();

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
