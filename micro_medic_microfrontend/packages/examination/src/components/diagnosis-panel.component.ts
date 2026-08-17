import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MmButtonDirective } from '@micro-medic/design-system-angular';
import { ExaminationDraftStore } from '../state/examination-draft.store.js';

/**
 * The diagnosis, which this micro-frontend does not choose.
 *
 * This pane is the receiving end of the split. The doctor searches and selects in `icd10` — a
 * separate remote, on a separate port, written in Vue 3 — and the selection arrives here as
 * `ICD10_DISEASE_SELECTED` on the shared bus. There is no import in either direction: neither
 * package *can* name a symbol from the other, since Angular cannot import a Vue component, and
 * either can be redeployed while the other keeps running. That is the property the horizontal split
 * exists to demonstrate, and this component is where it becomes visible to the user.
 *
 * Note the asymmetry in the contract: `icd10` publishes a selection but never a *de*selection, because
 * `DiseaseSelectedPayload.disease` is not nullable. The Clear button below is therefore this
 * package's own, clearing this package's draft — not a message sent back across the bus.
 *
 * It reads the store rather than subscribing itself. The subscription belongs to
 * `ExaminationDraftStore` because the diagnosis is part of the draft, not part of this view — if
 * this component owned it, the value would vanish whenever the pane was conditionally hidden.
 *
 * `required` is not a claim about UI state; it mirrors `@NotBlank` on
 * `ExaminationRequest.diagnosisCode`. A submit without one can only ever 400.
 */
@Component({
    selector: 'exam-diagnosis-panel',
    standalone: true,
    imports: [MmButtonDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="exam-diagnosis" [class.exam-diagnosis--empty]="!draft.diagnosis()">
            <div class="exam-diagnosis__header">
                <h4 class="exam-diagnosis__heading" id="exam-diagnosis-heading">
                    Diagnosis
                    <span class="exam-diagnosis__required" aria-hidden="true">*</span>
                    <span class="mm-sr-only">(required)</span>
                </h4>
                @if (draft.diagnosis() && !readonly()) {
                    <mm-button
                        variant="tertiary"
                        size="sm"
                        label="Clear"
                        (click)="draft.clearDiagnosis()"
                    ></mm-button>
                }
            </div>

            <!--
              'aria-live' because this region is filled in by a *different* micro-frontend. A
              sighted user sees the selection appear beside the list they clicked; without this
              announcement a screen-reader user gets no feedback that their click in the ICD-10
              pane did anything at all.
            -->
            <div class="exam-diagnosis__body" role="status" aria-live="polite">
                @if (draft.diagnosis(); as disease) {
                    <p class="exam-diagnosis__selected">
                        <code class="exam-diagnosis__code">{{ disease.code }}</code>
                        <span class="exam-diagnosis__description">{{ disease.description }}</span>
                    </p>
                } @else {
                    <p class="exam-diagnosis__prompt mm-muted">
                        Search the ICD-10 catalogue beside this form and select a diagnosis.
                    </p>
                }
            </div>

            @if (showError()) {
                <p class="exam-diagnosis__error" role="alert">
                    A diagnosis is required before the examination can be recorded.
                </p>
            }
        </div>
    `,
})
export class DiagnosisPanelComponent {
    protected readonly draft = inject(ExaminationDraftStore);

    /**
     * Hides the clear button and suppresses the required-field error.
     *
     * Bound to `ExaminationDraftStore.isLocked()`, which covers a submit in flight as well as a
     * recorded examination — the diagnosis is not a form control, so `form.disable()` in the parent
     * does not reach this pane.
     */
    readonly readonly = input(false);

    /**
     * Set by the parent when a submit was attempted with no diagnosis.
     *
     * Passed in rather than derived here for the same reason validators only speak after `touched`:
     * a field that is red before the doctor has done anything trains people to ignore red.
     */
    readonly submitAttempted = input(false);

    protected readonly showError = (): boolean =>
        this.submitAttempted() && !this.draft.diagnosis() && !this.readonly();
}
