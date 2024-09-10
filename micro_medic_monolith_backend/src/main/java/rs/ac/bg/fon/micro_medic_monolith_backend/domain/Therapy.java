package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;


@Entity

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@EqualsAndHashCode
@ToString
public class Therapy {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String instructions;

    @OneToOne
    @JoinColumn(name = "examination_id")
    private Examination examination;

    @OneToMany
    private List<MedicineUsage> medicineUsage;
}
