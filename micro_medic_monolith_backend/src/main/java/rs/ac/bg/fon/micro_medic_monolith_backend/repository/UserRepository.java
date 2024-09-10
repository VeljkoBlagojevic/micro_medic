package rs.ac.bg.fon.micro_medic_monolith_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.User;

import java.util.Optional;

@Repository
public interface UserRepository<T extends User>  extends JpaRepository<T, Long> {
    Optional<T> findByUsername(String username);
}
