import { createService } from '@micro-medic/api-client';
import type { ReportDto } from '@micro-medic/shared-types';

const reportApi = createService('api/reports');

/**
 * The slice of `controller/ReportController` this MFE needs: after an examination is recorded,
 * the doctor can generate and download its report without leaving the screen.
 */
export const reportService = {
    /** `POST /api/reports/examination/{id}` — 201, returns the created `ReportDto`. */
    generateForExamination(examinationId: number): Promise<ReportDto> {
        return reportApi.post<ReportDto>(`/examination/${examinationId}`);
    },

    /**
     * `GET /api/reports/{id}/download` — PDF bytes, produced by hand in `PdfGenerationService`
     * (no PDF library on the classpath). Goes through `downloadBlob` so the response interceptor
     * does not try to read it as JSON.
     */
    download(reportId: number): Promise<Blob> {
        return reportApi.downloadBlob(`/${reportId}/download`);
    },
};
