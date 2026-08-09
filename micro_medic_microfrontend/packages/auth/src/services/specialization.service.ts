import { createService } from '@micro-medic/api-client';
import type { Page, SpecializationDepartmentDto } from '@micro-medic/shared-types';

/**
 * Mirrors `controller/SpecializationDepartmentController`.
 *
 * The path is camelCase, matching the controller's `@RequestMapping`, and
 * `GET /api/specializationDepartments/**` is one of the `permitAll` matchers — which it has
 * to be, since the doctor registration form needs the list before anyone has a token.
 */
const specializationApi = createService('api/specializationDepartments');

export const specializationService = {
    list(params?: { page?: number; size?: number }): Promise<Page<SpecializationDepartmentDto>> {
        return specializationApi.get<Page<SpecializationDepartmentDto>>('', params);
    },
};
