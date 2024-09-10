package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.*;


@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@EqualsAndHashCode
@ToString
public class LoginRequest {
  @NotBlank(message = "Username can't be empty")
  private String username;
  @NotBlank(message = "Password can't be empty")
  private String password;
}
