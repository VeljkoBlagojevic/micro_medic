package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Builder;
import lombok.Data;

@Entity

@Data
@Builder
public class MedicineUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String methodUse;

    @NotNull
    @PositiveOrZero
    private Integer frequencyIntakeInHours;

    @ManyToOne
    @JoinColumn(name = "medicine_id")
    @NotNull
    private Medicine medicine;
}
