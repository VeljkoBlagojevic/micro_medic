package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth.ChangePasswordRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth.UpdateProfileRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.DuplicateResourceException;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof UserDetails userDetails) {
            return (User) userDetails;
        }

        throw new IllegalStateException("User not authenticated");
    }

    public User updateProfile(UpdateProfileRequest request) {
        User current = getCurrentUser();

        if(!current.getEmail().equals(request.email())) {
            userRepository.findByEmail(request.email()).ifPresent(existing -> {
                if (!existing.getId().equals(current.getId())) {
                    throw new DuplicateResourceException("Email is already in use by another user.");
                }
            });
        }

        current.setFirstname(request.firstname());
        current.setLastname(request.lastname());
        current.setEmail(request.email());

        return userRepository.save(current);
    }

    public void changePassword(ChangePasswordRequest request) {
        User currentUser = getCurrentUser();

        if (!passwordEncoder.matches(request.currentPassword(), currentUser.getPassword())) {
            throw new IllegalArgumentException("Current password does not match.");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("New password and confirmation do not match.");
        }

        currentUser.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(currentUser);


    }
}
