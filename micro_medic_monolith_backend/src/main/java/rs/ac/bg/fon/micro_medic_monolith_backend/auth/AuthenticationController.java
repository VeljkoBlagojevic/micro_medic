package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.DtoMapper;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.service.UserService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authService;
    private final UserService userService;

    @PostMapping("/registerDoctor")
    public ResponseEntity<AuthenticationResponseDto> registerDoctor(@RequestBody @Valid DoctorRegisterRequest request) {
        return ResponseEntity.ok(authService.registerDoctor(request));
    }

    @PostMapping("/registerPatient")
    public ResponseEntity<AuthenticationResponseDto> registerPatient(@RequestBody @Valid PatientRegisterRequest request) {
        return ResponseEntity.ok(authService.registerPatient(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponseDto> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(DtoMapper.toUserDto(currentUser));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateUser(@RequestBody @Valid UpdateProfileRequest request) {
        User updatedUser = userService.updateProfile(request);
        return ResponseEntity.ok(DtoMapper.toUserDto(updatedUser));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.noContent().build();
    }
}
