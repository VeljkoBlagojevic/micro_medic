import { createService } from '@micro-medic/api-client';
import type { MedicineDto, Page } from '@micro-medic/shared-types';

const medicineApi = createService('api/medicines');

/**
 * Mirrors `controller/MedicineController`.
 *
 * `GET /api/medicines/**` is `permitAll` and server-side cached (cache name `medicines`, no TTL —
 * reference data only), so the picker can search freely without worrying about load.
 */
export const medicineService = {
    list(params?: { page?: number; size?: number }): Promise<Page<MedicineDto>> {
        return medicineApi.get<Page<MedicineDto>>('', params);
    },

    /**
     * `query` is matched against the generic and brand names by a JPQL `search(...)`. A blank
     * query is accepted by the backend (the parameter is `required = false`), but callers should
     * prefer `list` for that case so the cached unfiltered page is reused.
     */
    search(query: string, params?: { page?: number; size?: number }): Promise<Page<MedicineDto>> {
        return medicineApi.get<Page<MedicineDto>>('/search', { query, ...params });
    },

    getById(medicineId: number): Promise<MedicineDto> {
        return medicineApi.get<MedicineDto>(`/${medicineId}`);
    },
};
