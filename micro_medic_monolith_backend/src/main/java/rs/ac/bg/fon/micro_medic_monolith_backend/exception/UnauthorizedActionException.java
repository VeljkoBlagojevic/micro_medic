package rs.ac.bg.fon.micro_medic_monolith_backend.exception;

public class UnauthorizedActionException extends RuntimeException {
    public UnauthorizedActionException(String message) {
        super(message);
    }
}
