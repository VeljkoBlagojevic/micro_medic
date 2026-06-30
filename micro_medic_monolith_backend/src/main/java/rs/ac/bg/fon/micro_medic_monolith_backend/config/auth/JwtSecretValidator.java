package rs.ac.bg.fon.micro_medic_monolith_backend.config.auth;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Slf4j
@Service
public class JwtSecretValidator {

    private static final int MIN_KEY_BYTES = 32; // H256 requires a 256-bit key

    private final String secretKey;
    private final Environment environment;

    public JwtSecretValidator(@Value("{app.jwt.secret:}") String secretKey, Environment environment) {
        this.secretKey = secretKey;
        this.environment = environment;
    }

    @PostConstruct
    void validate() {
        boolean dev = Arrays.asList(environment.getActiveProfiles()).contains("dev");

        if (secretKey == null || secretKey.trim().isEmpty()) {
            fail(dev, "app.jwt.secret is missing or blank. Set thje JWT_SECRET env variable to a Base64-encoded key of at least 256 bits");
            return;
        }

        int keyBytes;
        try {
            keyBytes = java.util.Base64.getDecoder().decode(secretKey).length;
        } catch (RuntimeException e) {
            fail(dev, "app.jwt.secret is not a valid Base64-encoded string");
            return;
        }
        if (keyBytes < MIN_KEY_BYTES) {
            fail(dev, String.format("app.jwt.secret is too short. It must be at least %d bytes (256 bits), but was %d bytes", MIN_KEY_BYTES, keyBytes));
        }
    }

    private void fail(boolean dev, String message) {
        if (dev) {
            log.warn("JWT secret validation failed: {}", message);
        } else {
            throw new IllegalStateException(message);
        }
    }
}
