package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLDelete(sql = "UPDATE report SET deleted = true HWERE id = ?")
@SQLRestriction("deleted = false")

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
public class Report extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @PastOrPresent
    private LocalDateTime creationTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    private String title;

    @OneToOne
    @JoinColumn(name = "examination_id", unique = true)
    private Examination examination;

    @ManyToOne
    @JoinColumn(name = "generated_by")
    private User generatedBy;

    @Builder.Default
    private boolean deleted = false;

    public enum Type {
        EXAMINATION_REPORT,
        PRESCRIPTION,
        MEDICAL_HISTORY
    }
}
