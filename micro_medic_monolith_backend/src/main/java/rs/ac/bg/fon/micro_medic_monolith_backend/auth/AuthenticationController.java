package rs.ac.bg.fon.micro_medic_monolith_backend.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/registerDoctor")
    public ResponseEntity<AuthenticationResponse> registerDoctor(@RequestBody @Valid DoctorRegisterRequest request) {
        return ResponseEntity.ok(authenticationService.registerDoctor(request));
    }

    @PostMapping("/registerPatient")
    public ResponseEntity<AuthenticationResponse> registerPatient(@RequestBody @Valid PatientRegisterRequest request) {
        return ResponseEntity.ok(authenticationService.registerPatient(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authenticationService.login(request));
    }


}
