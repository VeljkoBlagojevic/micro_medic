package rs.ac.bg.fon.micro_medic_monolith_backend.exception;

public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(resourceName + " with " + fieldName + " '" + fieldValue + "' already exists.");
    }
}
