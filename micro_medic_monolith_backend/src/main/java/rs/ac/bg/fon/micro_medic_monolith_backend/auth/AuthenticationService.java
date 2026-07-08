package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.ac.bg.fon.micro_medic_monolith_backend.config.auth.JwtService;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Doctor;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Patient;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth.AuthenticationResponseDto;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth.DoctorRegisterRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth.LoginRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth.PatientRegisterRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.SpecializationDepartmentRepository;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final SpecializationDepartmentRepository specializationDepartmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthenticationResponseDto registerDoctor(@Valid DoctorRegisterRequest request) {
        validateUniqueEmail(request.getEmail());

        var specialization = specializationDepartmentRepository.findById(request.getSpecializationId())
                .orElseThrow(() -> new IllegalArgumentException("Specialization not found"));

        Doctor doctor = new Doctor(
                request.getFirstName(),
                request.getLastName(),
                specialization,
                request.getEmail(),
                passwordEncoder.encode(request.getPassword())
        );

        userRepository.save(doctor);
        String jwtToken = jwtService.generateToken(doctor);
        return new AuthenticationResponseDto(jwtToken, DtoMapper.toUserDto(doctor));
    }

    private void validateUniqueEmail(@NotBlank String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
    }

    @Transactional
    public AuthenticationResponseDto registerPatient(@Valid PatientRegisterRequest request) {
        validateUniqueEmail(request.getEmail());

        Patient patient = new Patient(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword())
        );

        userRepository.save(patient);
        String jwtToken = jwtService.generateToken(patient);
        return new AuthenticationResponseDto(jwtToken, DtoMapper.toUserDto(patient));
    }

    public AuthenticationResponseDto login(LoginRequest request) {
        authenticationManager.authenticate(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );
        User user  = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String jwtToken = jwtService.generateToken(user);
        return new AuthenticationResponseDto(jwtToken, DtoMapper.toUserDto(user));
    }
}
