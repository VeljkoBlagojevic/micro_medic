package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@EqualsAndHashCode
@ToString
public abstract class RegisterRequest {
  @NotBlank(message = "Your firstname cannot be blank")
  private String firstname;
  @NotBlank(message = "Your lastname cannot be blank")
  private String lastname;
  @NotBlank(message = "Your email cannot be blank")
  @Email(message = "Your email address is not valid")
  private String email;
  @NotBlank(message = "Your username cannot be blank")
  private String username;
  @NotBlank(message = "Your password cannot be blank")
  private String password;

  public RegisterRequest(String firstname, String lastname, String email, String username, String password) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.username = username;
    this.password = password;
  }
}
