import { createService } from '@micro-medic/api-client';
import type {
    ExaminationDetailDto,
    ExaminationDto,
    ExaminationRequest,
    ExaminationStatus,
    LocalDateTimeString,
    Page,
} from '@micro-medic/shared-types';

const examinationApi = createService('api/examinations');

/** Query parameters of `GET /api/examinations/search`, mirroring the controller's signature. */
export interface ExaminationSearchParams {
    patientId?: number;
    doctorId?: number;
    examinationStatus?: ExaminationStatus;
    diagnosisCode?: string;
    startedAfter?: LocalDateTimeString;
    startedBefore?: LocalDateTimeString;
    page?: number;
    size?: number;
    sort?: string;
}

/**
 * Mirrors `controller/ExaminationController`.
 *
 * Declared with `createService` rather than a hand-built axios call — which is what the previous
 * Svelte implementation did — so the token, the `baseURL`, the `ApiError` normalisation and the
 * `onUnauthorized` logout all come from the one shared interceptor chain. A micro-frontend that
 * builds its own `Authorization` header is a micro-frontend that has to be told about every future
 * change to how auth works.
 */
export const examinationService = {
    /**
     * `POST /api/examinations` — records the examination and its therapy in one transaction.
     *
     * Requires `ROLE_DOCTOR` at both the URL matcher and `ExaminationService.examine`.
     */
    examine(request: ExaminationRequest): Promise<ExaminationDetailDto> {
        return examinationApi.post<ExaminationDetailDto>('', request);
    },

    getById(examinationId: number): Promise<ExaminationDetailDto> {
        return examinationApi.get<ExaminationDetailDto>(`/${examinationId}`);
    },

    /**
     * The patient's examination history, used by the context pane to show the doctor what came
     * before. Authorised row-by-row by `AccessGuard.requirePatientAccess`, so a doctor with no
     * appointment for this patient gets a 403 — and the attempt is written to the audit log.
     */
    forPatient(
        patientId: number,
        params?: { page?: number; size?: number; sort?: string }
    ): Promise<Page<ExaminationDto>> {
        return examinationApi.get<Page<ExaminationDto>>(`/patient/${patientId}`, params);
    },

    /**
     * `GET /api/examinations/search`. The backend rejects a call with neither `patientId` nor
     * `doctorId`, so callers must narrow by at least one.
     */
    search(params: ExaminationSearchParams): Promise<Page<ExaminationDto>> {
        return examinationApi.get<Page<ExaminationDto>>('/search', { ...params });
    },
};
