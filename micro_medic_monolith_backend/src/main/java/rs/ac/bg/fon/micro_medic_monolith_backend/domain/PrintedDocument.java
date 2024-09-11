package rs.ac.bg.fon.micro_medic_monolith_backend.domain;

import jakarta.persistence.Entity;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity

@Getter
@Setter
@EqualsAndHashCode
@ToString
public class PrintedDocument extends Report {

    public PrintedDocument() {
    }

    public PrintedDocument(Long id, LocalDateTime timeGenerated) {
        super(id, timeGenerated);
    }

    public PrintedDocument(LocalDateTime timeGenerated) {
        super(timeGenerated);
    }

    @Override
    public String export() {
        return """
                <print>%s</print>
                """.formatted(getCreationTime().toString());
    }
}
