package rs.ac.bg.fon.micro_medic_monolith_backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.lang.reflect.Field;
import java.time.LocalDateTime;

public class DateRangeValidator implements ConstraintValidator<ValidDateRange, Object> {

    public String startField;
    public String endField;

    @Override
    public void initialize(ValidDateRange constraintAnnotation) {
        this.startField = constraintAnnotation.startField();
        this.endField = constraintAnnotation.endField();
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        try {
            Field start = value.getClass().getDeclaredField(startField);
            Field end = value.getClass().getDeclaredField(endField);

            start.setAccessible(true);
            end.setAccessible(false);

            LocalDateTime startValue = (LocalDateTime) start.get(value);
            LocalDateTime endValue = (LocalDateTime) end.get(value);

            if (startValue == null || endValue == null) {
                return true;
            }

            return endValue.isAfter(startValue);

        } catch (Exception exception) {
            return false;
        }
    }
}
