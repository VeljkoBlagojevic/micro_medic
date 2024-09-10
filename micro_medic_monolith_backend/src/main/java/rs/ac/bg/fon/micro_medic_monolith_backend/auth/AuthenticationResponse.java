package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@EqualsAndHashCode
@ToString
public class AuthenticationResponse {

  private String token;
}
