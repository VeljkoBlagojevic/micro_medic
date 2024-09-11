package rs.ac.bg.fon.micro_medic_monolith_backend.service;

import com.google.common.base.Preconditions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.ac.bg.fon.micro_medic_monolith_backend.controller.examination.ExaminationRequest;
import rs.ac.bg.fon.micro_medic_monolith_backend.domain.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.repository.*;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExaminationService {

    private final ExaminationRepository examinationRepository;
    private final DiseaseRepository diseaseRepository;
    private final TherapyRepository therapyRepository;
    private final MedicineUsageRepository medicineUsageRepository;
    private final MedicineRepository medicineRepository;


    public Examination examine(ExaminationRequest examinationRequest) {
        if (examinationRequest == null) {
            throw new IllegalArgumentException("Examination request can't be null");
        }

        String diagnosisId;
        try {
            diagnosisId = examinationRequest.diagnosisCode();
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid diagnosis code format", e);
        }

        Disease diagnosis = diseaseRepository.findById(diagnosisId).orElseThrow(() -> new IllegalArgumentException("Nije pronadjena data bolest"));

        List<MedicineUsage> medicineUsage = examinationRequest.medicationAdministration().stream().map(request -> {
            var medicine = medicineRepository.findById(Long.parseLong(request.medicineId())).orElseThrow(() -> new IllegalArgumentException("Medicine" + request.medicineId() + " nije pronadjen"));

            return MedicineUsage.builder()
                    .methodUse(request.methodUse())
                    .frequencyIntakeInHours(request.usageFrequencyInHours())
                    .medicine(medicine)
                    .build();
        }).toList();

        var savedMedicineUsages = medicineUsageRepository.saveAll(medicineUsage);

        var examination = Examination.builder()
                .start(examinationRequest.start())
                .diagnosis(diagnosis)
                .anamnesis(examinationRequest.medicalHistory())
                .end(LocalDateTime.now())
                .build();

        var savedExamination = examinationRepository.save(examination);

        var therapy = Therapy.builder()
                .medicineUsage(savedMedicineUsages)
                .examination(savedExamination)
                .instructions(examinationRequest.therapyDescription())
                .build();

        therapyRepository.save(therapy);

        return savedExamination;
    }
}
