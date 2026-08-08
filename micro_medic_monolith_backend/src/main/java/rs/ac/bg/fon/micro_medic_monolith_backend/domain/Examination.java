package rs.ac.bg.fon.micro_medic_monolith_backend.domain;


import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLDelete(sql = "UPDATE examination SET deleted = true WHERE ID = ?")
@SQLRestriction("deleted = false")

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
public class Examination extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    private LocalDateTime start;
    private LocalDateTime end;

    private String anamnesis;

    @Enumerated(EnumType.STRING)
    private Status status;

    @OneToOne
    @JoinColumn(name = "scheduled_appointment_id")
    private ScheduledAppointment scheduledAppointment;

    @ManyToOne
    @JoinColumn(name = "diagnosis")
    private Disease diagnosis;

    @Builder.Default
    private boolean deleted = false;

    public enum Status {
        SCHEDULED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }


}
