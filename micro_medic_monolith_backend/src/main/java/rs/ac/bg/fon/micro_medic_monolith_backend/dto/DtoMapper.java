package rs.ac.bg.fon.micro_medic_monolith_backend.dto;

import rs.ac.bg.fon.micro_medic_monolith_backend.domain.*;
import rs.ac.bg.fon.micro_medic_monolith_backend.dto.auth.*;

import java.time.LocalDateTime;

public final class DtoMapper {

    private DtoMapper() {
        // Private constructor to prevent instantiation
    }

    public static UserDto toUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getFirstname(),
                user.getLastname(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    public static DoctorDto toDoctorDto(Doctor doctor) {
        return new DoctorDto(
                doctor.getId(),
                doctor.getFirstname(),
                doctor.getLastname(),
                doctor.getEmail(),
                toSpecializationDepartmentDto(doctor.getSpecialization())
        );
    }

    public static PatientDto toPatientDto(Patient patient) {
        return new PatientDto(
                patient.getId(),
                patient.getFirstname(),
                patient.getLastname(),
                patient.getEmail()
        );
    }

    public static SpecializationDepartmentDto toSpecializationDepartmentDto(SpecializationDepartment specialization) {
        return new SpecializationDepartmentDto(
                specialization.getId(),
                specialization.getName()
        );
    }

    public static DiseaseDto toDiseaseDto(Disease disease) {
        return new DiseaseDto(
                disease.getCode(),
                disease.getDescription()
        );
    }

    public static MedicineDto toMedicineDto(Medicine medicine) {
        return new MedicineDto(
                medicine.getId(),
                medicine.getGenericName(),
                medicine.getBrandName(),
                medicine.getForm().getName()
        );
    }

    public static ScheduledAppointmentDto toScheduledAppointmentDto(ScheduledAppointment appointment) {
        return new ScheduledAppointmentDto(
                appointment.getId(),
                appointment.getStart(),
                appointment.getEnd(),
                toPatientDto(appointment.getPatient()),
                toDoctorDto(appointment.getDoctor()),
                appointment.getStatus().name()
        );
    }

    public static TherapyDto toTherapyDto(Therapy therapy) {
        return new TherapyDto(
                therapy.getId(),
                therapy.getInstructions(),
                therapy.getMedicineUsages()
                        .stream()
                        .map(DtoMapper::toMedicineUsageDto)
                        .toList()
        );
    }

    private static MedicineUsageDto toMedicineUsageDto(MedicineUsage medicineUsage) {
        return new MedicineUsageDto(
                medicineUsage.getId(),
                medicineUsage.getMethodUse(),
                medicineUsage.getFrequencyIntakeInHours(),
                toMedicineDto(medicineUsage.getMedicine())
        );
    }

    public static ExaminationDetailDto toExaminationDetailDto(Examination exam, Therapy therapy) {
        return new ExaminationDetailDto(
                exam.getId(),
                exam.getStart(), exam.getEnd(),
                exam.getAnamnesis(),
                exam.getStatus().name(),
                toDiseaseDto(exam.getDiagnosis()),
                toScheduledAppointmentDto(exam.getScheduledAppointment()),
                toTherapyDto(therapy)
        );
    }

    public static ExaminationDto toExaminationDto(Examination ex) {
        return new ExaminationDto(
                ex.getId(),
                ex.getStart(),
                ex.getEnd(),
                ex.getAnamnesis(),
                ex.getStatus().name(),
                toDiseaseDto(ex.getDiagnosis())
        );
    }

        public static MedicalAccessLogDto toMedicalAccessLogDto(MedicalAccessLog medicalAccessLog) {
        return new MedicalAccessLogDto(
                medicalAccessLog.getId(),
                medicalAccessLog.getAccessorId(),
                medicalAccessLog.getAccessorRole(),
                medicalAccessLog.getResourceType().name(),
                medicalAccessLog.getResourceId(),
                medicalAccessLog.getPatientId(),
                medicalAccessLog.getAccessedAt()
        );
    }

    public static ReportDto toReportDto(Report report) {
        return new ReportDto(
                report.getId(),
                report.getCreatedAt(),
                report.getType().name(),
                report.getTitle(),
                report.getExamination().getId(),
                toUserDto(report.getGeneratedBy())
        );
    }
}
