package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.PastOrPresent;
import lombok.*;

import java.time.LocalDateTime;

@Entity

@Getter
@Setter
@EqualsAndHashCode
@ToString
public abstract class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @PastOrPresent(message = "Creation time must be in the past or present")
    private LocalDateTime creationTime;

    protected Report() {
    }

    protected Report(Long id, LocalDateTime creationTime) {
        this.id = id;
        this.creationTime = creationTime;
    }

    protected Report(LocalDateTime creationTime) {
        this.creationTime = creationTime;
    }

    public abstract String export();
}
