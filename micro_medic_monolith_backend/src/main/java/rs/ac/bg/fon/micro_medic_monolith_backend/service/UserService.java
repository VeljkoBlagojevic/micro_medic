package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;

@Service
@RequiredArgsConstructor
public class UserService {

    public User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getDetails();
    }

}
