package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
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
    private String methodUse;

    //every 6 hours
    private Integer frequencyIntakeInHours;

    @ManyToOne
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

}
