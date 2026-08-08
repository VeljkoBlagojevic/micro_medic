import { createService } from '@micro-medic/api-client';
import type { Page, PatientDto } from '@micro-medic/shared-types';
import type { PatientOption } from '../types';

const patientApi = createService('api/patients');

export const patientService = {
    async search(query: string): Promise<PatientOption[]> {
        const page = await patientApi.get<Page<PatientDto>>('/search', {
            query,
            page: 0,
            size: 10,
            sort: 'lastname,asc'
        });
        return page.content.map((patient) => ({
            id: patient.id,
            label: `${patient.firstname} ${patient.lastname}`,
            sublabel: patient.email || ''
        }));
    }
}