package rs.ac.bg.fon.micro_medic_monolith_backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));
        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                "Invalid request parameters",
                fieldErrors,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiError> handleEntityNotFoundException(EntityNotFoundException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiError);
    }

    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<ApiError> handleJakartaEntityNotFoundException(jakarta.persistence.EntityNotFoundException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiError);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiError> handleDuplicateResourceException(DuplicateResourceException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.CONFLICT.value(),
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiError);
    }

    @ExceptionHandler(UnauthorizedActionException.class)
    public ResponseEntity<ApiError> handleUnauthorizedActionException(UnauthorizedActionException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN.value(),
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(apiError);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(IllegalArgumentException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalStateException(IllegalStateException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentialsException(BadCredentialsException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiError);
    }

    @ExceptionHandler(UnsupportedOperationException.class)
    public ResponseEntity<ApiError> handleUnsupportedOperationException(UnsupportedOperationException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(apiError);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(AccessDeniedException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN.value(),
                ex.getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(apiError);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.CONFLICT.value(),
                "Data integrity violation: " + ex.getMostSpecificCause().getMessage(),
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiError);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex) {
        log.error("An unexpected error occurred: ", ex);
        ApiError apiError = new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred. Please try again later.",
                null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiError);
    }
}
