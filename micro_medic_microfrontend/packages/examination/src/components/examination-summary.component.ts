import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { MmButtonDirective, MmCardDirective } from '@micro-medic/design-system-angular';
import type { ExaminationDetailDto } from '@micro-medic/shared-types';
import { formatFrequency } from '../models/prescription.js';
import { reportService } from '../services/report.service.js';
import { EventBusService } from '../state/event-bus.service.js';
import { durationInMinutes, formatDateTime } from '../utils/date-time.js';
import { reportErrorMessage } from '../utils/error-message.js';

/**
 * What was recorded, shown after a successful submit.
 *
 * Renders the server's `ExaminationDetailDto` rather than the draft that produced it. That is the
 * point of the pane: the backend fills in the end time, the status and the therapy id, and echoing
 * the local draft back would show the doctor what they typed instead of what was actually stored.
 *
 * The report action lives here because it only exists once there is an examination id, and it is
 * kept deliberately separate from the submit: `POST /api/reports/examination/{id}` is a distinct
 * command, and a failure to generate a PDF must not read as a failure to record the examination.
 */
@Component({
    selector: 'exam-summary',
    standalone: true,
    imports: [MmCardDirective, MmButtonDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <mm-card heading="Examination recorded">
            <!-- `role="status"` so the outcome is announced, not just shown. -->
            <div role="status">
                <p class="exam-summary__lead">
                    Examination <strong>#{{ examination().id }}</strong> was saved and the
                    appointment marked completed.
                </p>

                <dl class="exam-summary__list">
                    <dt class="exam-summary__term">Started</dt>
                    <dd class="exam-summary__value">{{ when(examination().start) }}</dd>

                    <dt class="exam-summary__term">Completed</dt>
                    <dd class="exam-summary__value">{{ when(examination().end) }}</dd>

                    @if (duration(); as minutes) {
                        <dt class="exam-summary__term">Duration</dt>
                        <dd class="exam-summary__value">{{ minutes }} min</dd>
                    }

                    <dt class="exam-summary__term">Status</dt>
                    <dd class="exam-summary__value">{{ examination().status }}</dd>

                    @if (examination().disease; as disease) {
                        <dt class="exam-summary__term">Diagnosis</dt>
                        <dd class="exam-summary__value">
                            <code>{{ disease.code }}</code> — {{ disease.description }}
                        </dd>
                    }
                </dl>

                @if (examination().therapy; as therapy) {
                    <h4 class="exam-summary__subheading">Therapy</h4>
                    <p class="exam-summary__instructions">{{ therapy.instructions }}</p>

                    @if (therapy.medicineUsages.length > 0) {
                        <ul class="exam-summary__medicines">
                            @for (usage of therapy.medicineUsages; track usage.id) {
                                <li>
                                    <strong>{{ usage.medicine.brandName || usage.medicine.genericName }}</strong>
                                    — {{ usage.methodUse }},
                                    <!--
                                      Note the field name: the response DTO calls this
                                      `frequencyIntakeInHours` while the request called it
                                      `usageFrequencyInHours`. Same value, two spellings.
                                    -->
                                    {{ frequency(usage.frequencyIntakeInHours) }}
                                </li>
                            }
                        </ul>
                    } @else {
                        <p class="mm-muted">No medicines prescribed.</p>
                    }
                }

                @if (reportError(); as message) {
                    <p class="exam-summary__error" role="alert">{{ message }}</p>
                }
            </div>

            <div slot="footer" class="exam-summary__actions">
                <mm-button
                    variant="secondary"
                    label="Download report"
                    [loading]="generating()"
                    (click)="generateReport()"
                ></mm-button>
                <mm-button
                    variant="primary"
                    label="Start another examination"
                    (click)="startAnother.emit()"
                ></mm-button>
            </div>
        </mm-card>
    `,
})
export class ExaminationSummaryComponent {
    private readonly bus = inject(EventBusService);

    /** `input.required` — this component is meaningless without a result, so make that a compile error. */
    readonly examination = input.required<ExaminationDetailDto>();

    readonly startAnother = output<void>();

    protected readonly generating = signal(false);
    protected readonly reportError = signal<string | null>(null);

    protected when = formatDateTime;
    protected frequency = formatFrequency;

    protected readonly duration = (): number | null =>
        durationInMinutes(this.examination().start, this.examination().end);

    /**
     * Generates the report and hands the PDF to the browser.
     *
     * Two calls, not one: `POST` creates the `Report` row and `GET /{id}/download` returns the bytes
     * that `PdfGenerationService` assembles by hand. The object URL is revoked immediately after the
     * click — the blob would otherwise be held for the lifetime of the document, and this MFE may be
     * mounted and unmounted many times per session.
     */
    protected async generateReport(): Promise<void> {
        this.generating.set(true);
        this.reportError.set(null);

        try {
            const report = await reportService.generateForExamination(this.examination().id);
            const blob = await reportService.download(report.id);

            const url = URL.createObjectURL(blob);
            try {
                const link = document.createElement('a');
                link.href = url;
                link.download = `examination-${this.examination().id}-report.pdf`;
                link.click();
            } finally {
                URL.revokeObjectURL(url);
            }

            this.bus.notify('success', 'Report generated.');
        } catch (error) {
            const message = reportErrorMessage(error);
            // Rendered inline *and* announced: a toast published while `notifications` is unmounted
            // is lost, and this is the one message that must not disappear.
            this.reportError.set(message);
            this.bus.notify('error', message);
        } finally {
            this.generating.set(false);
        }
    }
}
