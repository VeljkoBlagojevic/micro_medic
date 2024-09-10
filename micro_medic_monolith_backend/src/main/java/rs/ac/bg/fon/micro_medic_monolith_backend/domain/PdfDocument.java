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
public class PdfDocument extends Report {

    public PdfDocument() {
    }

    public PdfDocument(Long id, LocalDateTime vremeGenerisanja) {
        super(id, vremeGenerisanja);
    }

    public PdfDocument(LocalDateTime vremeGenerisanja) {
        super(vremeGenerisanja);
    }

    @Override
    public String export() {
        return """
                <PDF>%s</PDF>
                """.formatted(getCreationTime().toString());
    }
}
