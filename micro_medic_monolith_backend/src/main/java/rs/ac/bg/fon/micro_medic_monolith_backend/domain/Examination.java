package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;


@Entity

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@EqualsAndHashCode
@ToString
public class Examination {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private LocalDateTime start;

    private LocalDateTime end;

    private String anamnesis;

    private String status;

    @OneToOne
    @JoinColumn(name = "scheduled_appointment_id")
    private ScheduledAppointment scheduledAppointment;

    @OneToOne
    @JoinColumn(name = "diagnosis")
    private Disease diagnosis;

}
