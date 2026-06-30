package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        HttpStatus status,
        String message,
        T data,
        LocalDateTime timestamp) {

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(HttpStatus.OK, message, data, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return new ApiResponse<>(HttpStatus.CREATED, message, data, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> error(HttpStatus status, String message) {
        return new ApiResponse<>(status, message, null, LocalDateTime.now());
    }
}
