import type { AppointmentStatus, ExaminationStatus, MedicineFormName, ReportType, Role } from "./enums";

/**
 * The backend serialises `java.time.LocalDateTime` as ISO-8601 *without* an offset
 * (e.g. `2026-08-08T10:30:00`). `new Date(...)` reads that as local time, which is
 * what the server means — never treat these as UTC instants.
 */
export type LocalDateTimeString = string;

/**
 * Fields shared by every person the API returns.
 *
 * `role` is deliberately absent: the backend `PatientDto` / `DoctorDto` records carry
 * no role field. Only `dto/auth/UserDto` does, and it is returned solely by
 * `/api/auth/{login,registerDoctor,registerPatient,me}` and inside `ReportDto.generatedBy`.
 */
export interface PersonDto {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
}

/** Mirrors `dto/auth/UserDto` — the only DTO that exposes the caller's role. */
export interface UserDto extends PersonDto {
    role: Role;
}

/** Mirrors `dto/PatientDto`. */
export type PatientDto = PersonDto;

/** Mirrors `dto/DoctorDto`. */
export interface DoctorDto extends PersonDto {
    specialization: SpecializationDepartmentDto;
}

export interface SpecializationDepartmentDto {
    id: number;
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
    id: number;
    genericName: string;
    brandName: string;
    /** Serialised through `MedicineForm.getName()`, so a display name — not the enum constant. */
    form: MedicineFormName | null;
}

export interface ScheduledAppointmentDto {
    id: number;
    patient: PatientDto;
    doctor: DoctorDto;
    start: LocalDateTimeString;
    end: LocalDateTimeString;
    status: AppointmentStatus;
}

export interface MedicineUsageDto {
    id: number;
    medicine: MedicineDto;
    methodUse: string;
    frequencyIntakeInHours: number;
}

export interface TherapyDto {
    id: number;
    instructions: string;
    medicineUsages: MedicineUsageDto[];
}

export interface ExaminationDto {
    id: number;
    start: LocalDateTimeString;
    end: LocalDateTimeString;
    anamnesis: string;
    status: ExaminationStatus;
    /** The record component is named `disease`, even though the entity field is `diagnosis`. */
    disease: DiseaseDto | null;
}

export interface ExaminationDetailDto extends ExaminationDto {
    scheduledAppointment: ScheduledAppointmentDto | null;
    therapy: TherapyDto | null;
}

export interface ReportDto {
    id: number;
    creationTime: LocalDateTimeString;
    /** The record component is named `reportType`, not `type`. */
    reportType: ReportType;
    title: string;
    examinationId: number | null;
    generatedBy: UserDto | null;
}

export type AccessedResourceType = 'PATIENT' | 'EXAMINATION' | 'REPORT' | 'DOCTOR' | 'APPOINTMENT';

export interface MedicalAccessLogDto {
    id: number;
    accessorId: number;
    accessorRole: string;
    resourceType: AccessedResourceType;
    resourceId: number;
    patientId: number | null;
    accessedAt: LocalDateTimeString;
}

export interface DiagnosisCountDto {
    diagnosisCode: string;
    diseaseDescription: string;
    count: number;
}

export interface DoctorStatsDto {
    totalExaminations: number;
    totalAppointments: number;
    uniquePatientsSeen: number;
    topDiagnoses: DiagnosisCountDto[];
}

export interface PatientStatsDto {
    totalExaminations: number;
    totalAppointments: number;
    upcomingAppointments: number;
    distinctDoctorsSeen: number;
}

export interface PatientMedicalSummaryDto {
    patient: PatientDto;
    stats: PatientStatsDto;
    examinations: ExaminationDetailDto[];
    scheduledAppointments: ScheduledAppointmentDto[];
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

export interface AppointmentRequest {
    start: LocalDateTimeString;
    end: LocalDateTimeString;
    patientId: number;
}

export interface MedicineUsageRequest {
    methodUse: string;
    /** Note the name: the response DTO calls the same value `frequencyIntakeInHours`. */
    usageFrequencyInHours: number;
    medicineId: number;
}

export interface ExaminationRequest {
    scheduledAppointmentId: number;
    startTime: LocalDateTimeString;
    medicalHistory: string;
    diagnosisCode: string;
    therapyDescription: string;
    medicineUsages: MedicineUsageRequest[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * `dto/auth/RegisterRequest` is a Lombok class, not a record, and its fields are
 * `firstName` / `lastName` — capital N, unlike every response DTO.
 */
export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export type PatientRegisterRequest = RegisterRequest;

export interface DoctorRegisterRequest extends RegisterRequest {
    specializationId: number;
}

export interface UpdateProfileRequest {
    firstname: string;
    lastname: string;
    email: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// ---------------------------------------------------------------------------
// Envelopes
// ---------------------------------------------------------------------------

/**
 * Mirrors `exception/ApiError` — the body of every non-2xx response from
 * `GlobalExceptionHandler`. `fieldErrors` is only present on validation failures.
 * This is what lands on `ApiError.data` in the api-client.
 */
export interface ApiErrorResponse {
    status: number;
    message: string;
    fieldErrors?: Record<string, string>;
    timestamp: LocalDateTimeString;
}

/**
 * Mirrors Spring Data's default (`DIRECT`) `Page` serialisation, which writes the
 * bean getters of `PageImpl`. The page index is `number` and the page size is
 * `size` — there are no `pageNumber` / `pageSize` fields.
 */
export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    /** Zero-based page index. */
    number: number;
    size: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}
