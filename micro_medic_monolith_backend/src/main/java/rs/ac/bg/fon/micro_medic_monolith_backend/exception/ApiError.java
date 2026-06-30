package rs.ac.bg.fon.micro_medic_monolith_backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String message,
        Map<String, String> fieldErrors,
        LocalDateTime timestamp
) {
}
