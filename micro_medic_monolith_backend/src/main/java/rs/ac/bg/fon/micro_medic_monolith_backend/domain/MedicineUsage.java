package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

@Entity

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@EqualsAndHashCode
@ToString
public class MedicineUsage {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    // general description of how to use medicine
    @NotBlank(message = "Method of use cannot be blank")
    private String methodUse;

    // Every 6 hours
    @NotNull(message = "Frequency of intake in hours cannot be null")
    @PositiveOrZero(message = "Frequency of intake in hours must be zero or positive")
    private Integer frequencyIntakeInHours;

    @ManyToOne
    @JoinColumn(name = "medicine_id")
    @NotNull(message = "Medicine cannot be null")
    private Medicine medicine;

}
