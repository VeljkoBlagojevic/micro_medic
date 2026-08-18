package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@SQLDelete(sql = "UPDATE scheduled_appointment SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PACKAGE)
@Builder
public class ScheduledAppointment extends Auditable implements Comparable<ScheduledAppointment> {

    public enum Status {
        SCHEDULED,
        COMPLETED,
        CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime start;
    private LocalDateTime end;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.SCHEDULED;

    @Builder.Default
    private boolean deleted = false;

    @Override
    public int compareTo(ScheduledAppointment o) {
        return start.compareTo(o.start);
    }
}
