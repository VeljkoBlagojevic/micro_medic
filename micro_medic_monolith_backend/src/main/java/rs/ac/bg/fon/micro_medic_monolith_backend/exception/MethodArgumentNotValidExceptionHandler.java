package rs.ac.bg.fon.micro_medic_monolith_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class MethodArgumentNotValidExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        ErrorResponse error = new ErrorResponse() {
            @Override
            public HttpStatusCode getStatusCode() {
                return HttpStatus.BAD_REQUEST;
            }

            @Override
            public ProblemDetail getBody() {
                String inputString = ex.getMessage();

                int startIndex = inputString.lastIndexOf("[") + 1;
                int endIndex = inputString.lastIndexOf("]") - 1;

                String extractedText = inputString.substring(startIndex, endIndex);

                return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, extractedText);
            }
        };
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
}
