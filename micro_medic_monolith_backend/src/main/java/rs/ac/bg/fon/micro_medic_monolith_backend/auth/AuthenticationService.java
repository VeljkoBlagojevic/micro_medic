package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.config.JwtService;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Doctor;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Patient;
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

//    public AuthenticationResponse register(RegisterRequest request) {
//        User user = User.builder()
//                .firstname(request.getFirstname())
//                .lastname(request.getLastname())
//                .email(request.getEmail())
//                .username(request.getUsername())
//                .password(passwordEncoder.encode(request.getPassword()))
//                .build();
//        userRepository.save(user);
//        String jwtToken = jwtService.generateToken(user);
//        return AuthenticationResponse.builder()
//                .token(jwtToken)
//                .build();
//    }

    public AuthenticationResponse registerDoctor(DoctorRegisterRequest request) {
        var specialization = specializationDepartmentRepository
                .findById(request.getSpecializationId())
                .orElseThrow(() -> new EntityNotFoundException("Specialization not found"));
        Doctor doctor = new Doctor(
                request.getFirstname(),
                request.getLastname(),
                request.getEmail(),
                request.getUsername(),
                passwordEncoder.encode(request.getPassword()),
                specialization);

        userRepository.save(doctor);
        String jwtToken = jwtService.generateToken(doctor);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthenticationResponse registerPatient(PatientRegisterRequest request) {
        Patient patient = new Patient(
                request.getFirstname(),
                request.getLastname(),
                request.getEmail(),
                request.getUsername(),
                passwordEncoder.encode(request.getPassword()));

        userRepository.save(patient);
        String jwtToken = jwtService.generateToken(patient);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthenticationResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()));
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Could not find user " + request.getUsername()));
        String jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }
}
