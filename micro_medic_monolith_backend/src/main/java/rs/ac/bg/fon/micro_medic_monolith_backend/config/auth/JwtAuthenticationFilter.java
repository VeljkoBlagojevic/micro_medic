package rs.ac.bg.fon.micro_medic_monolith_backend.config.auth;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {

        } catch (ExpiredJwtException e) {
            rejectToken(request, response, "expired", e);
            return;
        } catch (UnsupportedJwtException | MalformedJwtException | io.jsonwebtoken.security.SecurityException | IllegalArgumentException e) {
            rejectToken(request, response, "invalid", e);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void rejectToken(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            String reason,
            Exception cause) throws IOException, ServletException {
        log.warn("JWT token rejected: {}", reason, cause);
        SecurityContextHolder.clearContext();
        request.setAttribute(JwtAuthenticationEntryPoint.REASON_PHRASE, reason);
        jwtAuthenticationEntryPoint.commence(
                request,
                response,
                new BadCredentialsException("JWT token rejected: " + reason, cause)
        );
    }
}
