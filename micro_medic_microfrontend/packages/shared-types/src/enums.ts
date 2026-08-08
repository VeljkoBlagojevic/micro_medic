/**
 * Mirrors `domain/Role`. The values are the Spring Security authority strings, which
 * is what the backend serialises (`DtoMapper.toUserDto` writes `role.name()`).
 *
 * Careful: `Role.name()` is `DOCTOR` while `Role.getAuthority()` is `ROLE_DOCTOR`, and
 * `toUserDto` uses `name()`. The `ROLE_` prefix therefore does NOT appear in `UserDto.role`.
 */
export enum Role {
    ADMIN = 'ADMIN',
    DOCTOR = 'DOCTOR',
    NURSE = 'NURSE',
    PATIENT = 'PATIENT',
}

/** Mirrors `ScheduledAppointment.Status`. */
export enum AppointmentStatus {
    SCHEDULED = 'SCHEDULED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

/** Mirrors `Examination.Status`. */
export enum ExaminationStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

/** Mirrors `Report.Type`. */
export enum ReportType {
    EXAMINATION_REPORT = 'EXAMINATION_REPORT',
    PRESCRIPTION = 'PRESCRIPTION',
    MEDICAL_HISTORY = 'MEDICAL_HISTORY',
}

/**
 * The display names of `domain/MedicineForm`. `MedicineForm.getName()` is annotated
 * `@JsonValue`, so the wire format is the human-readable name ("Oral Suspension"),
 * not the enum constant (`ORAL_SUSPENSION`). Modelled as a union rather than an enum
 * because these values are only ever read, never constructed by the frontend.
 */
export type MedicineFormName =
    | 'Tablet'
    | 'Capsule'
    | 'Injectible'
    | 'Application'
    | 'Oral Suspension'
    | 'Suspension'
    | 'Solution'
    | 'Syrup'
    | 'Drop'
    | 'Inhaler'
    | 'Ointment'
    | 'Eye Ointment'
    | 'Suppository'
    | 'Nasal Spray'
    | 'Vaccine'
    | 'Lotion'
    | 'Powder'
    | 'Patch';
