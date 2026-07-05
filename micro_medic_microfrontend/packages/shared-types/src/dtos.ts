import { Role } from "./enums";

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface PatientDto extends UserDto {
    role: Role.PATIENT;
}

export interface DoctorDto extends UserDto {
    role: Role.DOCTOR;
    specialization: SpecializationDepartmentDto;
}

export interface AdminDto extends UserDto {
    role: Role.ADMIN;
}

export interface SpecializationDepartmentDto {
    id: string;
    name: string;
}

export interface AuthenticationResponseDto {
    token: string;
    user: UserDto;
}

export interface DiseaseDto {
    code: string;
    description: string;
}

export interface MedicineDto {
    id: string;
    genericName: string;
    brandName: string;
    form: string | null;
}

export interface ScheduledAppointmentDto {
    id: string;
    patient: PatientDto;
    doctor: DoctorDto;
    start: Date;
    end: Date;
    status: string;
}

export interface MedicineUsageDto {
    id: string;
    medicine: MedicineDto;
    methodUse: string;
    frequencyIntakeInHours: number;
}

export interface TherapyDto {
    id: string;
    instructions: string;
    medicineUsages: MedicineUsageDto[];
}

export interface ExaminationDto {
    id: string;
    start: Date;
    end: Date;
    anamnesis: string;
    status: string;
    diagnosis: DiseaseDto | null;
}

export interface ExaminationDetailDto extends ExaminationDto {
    scheduledAppointment: ScheduledAppointmentDto;
    therapy: TherapyDto | null;
}

export interface ReportDto {
    id: string;
    creationTime: Date;
    reportType: string;
    title: string;
    examinationId: string;
    generatedBy: string;
}

export interface ApiResponse<T> {
    data: T;
    message: string;
    status: number;
    timestamp: string;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
}