package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import com.google.common.base.Preconditions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.controller.pregled.PregledRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.*;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PregledService {

    private final ExaminationRepository examinationRepository;
    private final DiseaseRepository diseaseRepository;
    private final TherapyRepository therapyRepository;
    private final MedicineUsageRepository medicineUsageRepository;
    private final MedicineRepository medicineRepository;


    public Examination izvrsiPregled(PregledRequest pregledRequest) {
        Preconditions.checkNotNull(pregledRequest, "Morate proslediti pregled");
        Preconditions.checkArgument(pregledRequest.start().isBefore(LocalDateTime.now()), "Ne moze start da bude u buducnosti");

        long dijagnozaId;
        try {
            dijagnozaId = Long.parseLong(pregledRequest.dijagnozaCode());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid dijagnoza code format", e);
        }

        Disease dijagnoza = diseaseRepository.findById(dijagnozaId).orElseThrow(() -> new IllegalArgumentException("Nije pronadjena data bolest"));

        List<MedicineUsage> medicineUsageMedicineova = pregledRequest.primenaMedicineova().stream().map(request -> {
            var medicine = medicineRepository.findById(Long.parseLong(request.medicineId())).orElseThrow(() -> new IllegalArgumentException("Medicine" + request.medicineId() + " nije pronadjen"));

            return MedicineUsage.builder()
                    .methodUse(request.methodUse())
                    .frequencyIntakeInHours(request.frekvencijaUSatima())
                    .medicine(medicine)
                    .build();
        }).toList();

        var sacuvanePrimeneMedicineova = medicineUsageRepository.saveAll(medicineUsageMedicineova);

        var pregled = Examination.builder()
                .start(pregledRequest.start())
                .dijagnoza(dijagnoza)
                .anamnesis(pregledRequest.anamneza())
                .end(LocalDateTime.now())
                .build();

        var sacuvanPregled = examinationRepository.save(pregled);

        var terapija = Therapy.builder()
                .medicineUsage(sacuvanePrimeneMedicineova)
                .examination(sacuvanPregled)
                .instructions(pregledRequest.opisTerapije())
                .build();

        therapyRepository.save(terapija);

        return sacuvanPregled;
    }
}
