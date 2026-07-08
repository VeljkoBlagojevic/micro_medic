package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.List;

@Entity
@SQLDelete(sql = "UPDATE therapy SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
public class Therapy extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String instructions;

    @OneToOne
    @JoinColumn(name = "examination_id")
    private Examination examination;

    @OneToMany(mappedBy = "therapy", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedicineUsage> medicineUsages;

    @Builder.Default
    private boolean deleted = false;

}
