package rs.ac.bg.fon.micro_medic_monolith_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.NoSuchElementException;

@ControllerAdvice
public class NoSuchElementExceptionHandler {
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNoSuchElementException(NoSuchElementException ex) {
        ErrorResponse error = new ErrorResponse() {
            @Override
            public HttpStatusCode getStatusCode() {
                return HttpStatus.NOT_FOUND;
            }

            @Override
            public ProblemDetail getBody() {
                return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
            }
        };
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
}
