package rs.ac.bg.fon.micro_medic_monolith_backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = DateRangeValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidDateRange {

    String message() default "End time must be after start time";

    Class<?>[] group() default {};

    Class<? extends Payload>[] payload() default {};

    String startField();

    String endField();

}
