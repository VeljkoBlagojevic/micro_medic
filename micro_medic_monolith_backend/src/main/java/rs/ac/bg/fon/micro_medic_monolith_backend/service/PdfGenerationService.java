package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Examination;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Report;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.Therapy;

import java.time.format.DateTimeFormatter;

@Service
public class PdfGenerationService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm");

    public byte[] generateExaminationReportPdf(Report report, Examination examination, Therapy therapy) {
        return null;
    }
}
