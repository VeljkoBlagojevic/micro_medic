package rs.ac.bg.fon.micro_medic_monolith_backend.config.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import rs.ac.bg.fon.micro_medic_monolith_backend.config.RateLimitingFilter;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Role;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final RateLimitingFilter rateLimitingFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> {
                    authorize.requestMatchers(HttpMethod.POST, "/api/auth/registerDoctor").permitAll();
                    authorize.requestMatchers(HttpMethod.POST, "/api/auth/registerPatient").permitAll();
                    authorize.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll();

                    // Reference data. The bare path and the sub-paths need separate matchers -
                    // '/x/*' does not match '/**' itself.
                    authorize.requestMatchers(HttpMethod.GET, "/api/medicines", "/api/medicines/**").permitAll();
                    authorize.requestMatchers(HttpMethod.GET, "/api/diseases", "/api/diseases/**").permitAll();
                    authorize.requestMatchers(HttpMethod.GET, "/api/specializationDepartments", "/api/specializationDepartments/**").permitAll();

                    authorize.requestMatchers(HttpMethod.POST, "/api/calendar/**").hasAuthority(Role.DOCTOR.getAuthority());
                    authorize.requestMatchers(HttpMethod.POST, "/api/examinations/**").hasAuthority(Role.DOCTOR.getAuthority());

                    authorize.anyRequest().authenticated();
                })

                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitingFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
}
