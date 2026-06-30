package rs.ac.bg.fon.micro_medic_monolith_backend.exception;

public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String message) {
        super(message);
    }
    public EntityNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
    public  EntityNotFoundException(String entityName, Object identifier) {
        super(entityName + " with identifier " + identifier + " not found.");
    }
}
