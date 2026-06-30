package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.config.auth.JwtService;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.SpecializationDepartmentRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository<User> userRepository;
    private final SpecializationDepartmentRepository specializationDepartmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
//    private final EntityMapper entityMapper;
}
