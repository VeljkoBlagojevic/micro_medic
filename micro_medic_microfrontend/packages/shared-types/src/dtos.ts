import { Role } from "./enums";

export interface UserDto {
  id: number;
  firstname: string;
  lastname: string;
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
    start: string;
    end: string;
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
    start: string;
    end: string;
    anamnesis: string;
    status: string;
    diagnosis: DiseaseDto | null;
}

export interface ExaminationDetailDto extends ExaminationDto {
    scheduledAppointment: ScheduledAppointmentDto | null;
    therapy: TherapyDto | null;
}

export interface ReportDto {
    id: string;
    creationTime: string;
    type: string;
    title: string;
    examinationId: string | null;
    generatedBy: string | null;
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