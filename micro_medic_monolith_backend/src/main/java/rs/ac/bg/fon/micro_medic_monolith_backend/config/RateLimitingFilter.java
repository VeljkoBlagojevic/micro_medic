package rs.ac.bg.fon.micro_medic_monolith_backend.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import rs.ac.bg.fon.micro_medic_monolith_backend.exception.ApiError;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int CAPACITY = 20;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper;
    private final boolean trustForwardedFor;

    public RateLimitingFilter(
            ObjectMapper objectMapper,
            @Value("${app.rate-limit.trust-forwarded-for:false}") boolean trustForwardedFor) {
        this.objectMapper = objectMapper;
        this.trustForwardedFor = trustForwardedFor;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!path.startsWith("/api/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        Bucket bucket = resolveBucket(getClientIp(request));
        if (bucket == null) {
            reject(response, WINDOW.toSeconds());
            return;
        }

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            filterChain.doFilter(request, response);
        } else {
            reject(response, secondsUntilRefill(probe));
        }
    }

    private void reject(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        ApiError apiError = new ApiError(
                HttpStatus.TOO_MANY_REQUESTS.value(),
                "Too many requests. Please try again later.",
                null,
                LocalDateTime.now()
        );

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(retryAfterSeconds));
        response.getWriter().write(objectMapper.writeValueAsString(apiError));
    }

    private static long secondsUntilRefill(ConsumptionProbe probe) {
        long seconds = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill());
        return Math.max(1, seconds);
    }

    private @Nullable Bucket resolveBucket(String clientIp) {
        Bucket existing = buckets.get(clientIp);
        if (existing != null) {
            return existing;
        }

        if (buckets.size() >= MAX_TRACKED_CLIENTS) {
            evictRefilledBuckets();
            if (buckets.size() >= MAX_TRACKED_CLIENTS) {
                return null;
            }
        }

        return buckets.computeIfAbsent(clientIp, k -> createNewBucket());
    }

    private void evictRefilledBuckets() {
        buckets.values().removeIf(bucket -> bucket.getAvailableTokens() >= CAPACITY);
    }

    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.
                builder()
                .capacity(CAPACITY)
                .refillGreedy(CAPACITY, WINDOW)
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private String getClientIp(@NonNull HttpServletRequest request) {
        if (trustForwardedFor) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",", 2)[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
