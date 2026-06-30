package rs.ac.bg.fon.micro_medic_monolith_backend.config.auth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.ApiError;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    static final String REASON_PHRASE = "jwt_error_reason";
    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, @NonNull AuthenticationException authException) throws IOException, ServletException {
        Object reasonAttr = request.getAttribute(REASON_PHRASE);
        String reason = reasonAttr != null ? reasonAttr.toString() : "Unauthorized";

        String message = "expired".equals(reason) ? "JWT token has expired" :
                "invalid".equals(reason) ? "JWT token is invalid" :
                "missing".equals(reason) ? "JWT token is missing" :
                "Unauthorized";

        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                message,
                reason != null ? Map.of("reason", reason) : null,
                LocalDateTime.now()
        );

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(apiError));
    }
}
