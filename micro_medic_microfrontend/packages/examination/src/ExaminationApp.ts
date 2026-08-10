import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MmEmptyStateDirective } from '@micro-medic/design-system-angular';
import { AppointmentPickerComponent } from './components/appointment-picker.component.js';
import { ExaminationFormComponent } from './components/examination-form.component.js';
import { ExaminationSummaryComponent } from './components/examination-summary.component.js';
import { PatientContextComponent } from './components/patient-context.component.js';
import { AuthStore } from './state/auth.store.js';
import { ExaminationDraftStore } from './state/examination-draft.store.js';

// Namespaced, MFE-local styles. The document-wide theme (`tokens.css` + `global.css`) is loaded
// once by the shell — a remote that ships a reset collides with every other remote that does.
import './styles.css';

/**
 * The root of the examination micro-frontend: a phase machine over one draft.
 *
 * Four panes, one at a time, chosen by `ExaminationDraftStore.phase()` rather than by any component
 * asking another to hide. Recording an examination is genuinely sequential — you cannot fill in an
 * anamnesis for nobody, and you cannot edit one that has been committed — so modelling it as a phase
 * makes the impossible states unrepresentable instead of merely unlikely. `@switch` on a derived
 * signal is the whole implementation.
 *
 * This component is also the composition boundary of the split. It occupies its own mount point and
 * knows nothing about the ICD-10 pane beside it — not its port, not its markup, not even that it
 * exists. What it renders instead is the *effect* of that pane, arriving as `ICD10_DISEASE_SELECTED`
 * on the shared bus and landing in the store. The 3/4–1/4 geometry is likewise not here: it belongs
 * to `.mm-split--primary` in the shell, because a fragment cannot see the screen it shares.
 */
@Component({
    selector: 'exam-root',
    standalone: true,
    imports: [
        MmEmptyStateDirective,
        AppointmentPickerComponent,
        PatientContextComponent,
        ExaminationFormComponent,
        ExaminationSummaryComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <section class="exam" aria-labelledby="exam-heading">
            <header class="exam__header">
                <h2 class="exam__title" id="exam-heading">Examination</h2>
                @if (auth.displayName(); as name) {
                    <p class="exam__byline mm-muted">Recording as {{ name }}</p>
                }
            </header>

            @if (!auth.isAuthenticated()) {
                <!--
                  Reachable in practice: `activity.js` keeps an unauthenticated visitor off this
                  route, but a token can expire *while* this MFE is mounted — `api-client`'s
                  `onUnauthorized` clears the store, which lands here as a state change with no
                  route change behind it.
                -->
                <mm-empty-state
                    heading="Sign in to record an examination"
                    description="Your session has ended. Sign in again to continue."
                ></mm-empty-state>
            } @else if (!auth.isDoctor()) {
                <!--
                  Presentation, not authorisation. The backend refuses regardless — `ROLE_DOCTOR` on
                  the URL matcher, `@PreAuthorize` on `ExaminationService.examine`, and
                  `AccessGuard` row by row. This branch exists so a patient who typed the URL reads
                  an explanation instead of a form that 403s on submit.
                -->
                <mm-empty-state
                    heading="Only doctors record examinations"
                    description="Your account does not have the doctor role. Ask an administrator if you believe this is wrong."
                ></mm-empty-state>
            } @else {
                @switch (draft.phase()) {
                    @case ('selecting-appointment') {
                        <exam-appointment-picker></exam-appointment-picker>
                    }
                    @case ('recorded') {
                        <div class="exam__panes">
                            <exam-patient-context></exam-patient-context>
                            @if (draft.result(); as result) {
                                <exam-summary
                                    [examination]="result"
                                    (startAnother)="startAnother()"
                                ></exam-summary>
                            }
                        </div>
                    }
                    @default {
                        <!--
                          `editing` and `submitting` share this pane deliberately. A submit in flight
                          is the same screen with its controls locked, not a different screen: swapping
                          the form out for a spinner would discard the DOM the doctor is looking at and
                          make a failed submit reappear as a jarring re-mount.
                        -->
                        <div class="exam__panes">
                            <exam-patient-context></exam-patient-context>
                            <exam-examination-form></exam-examination-form>
                        </div>
                    }
                }
            }
        </section>
    `,
})
export class ExaminationApp {
    protected readonly draft = inject(ExaminationDraftStore);
    protected readonly auth = inject(AuthStore);

    /**
     * Back to a blank draft after a recorded examination.
     *
     * Clearing the store is the whole operation: `phase()` falls back to `selecting-appointment`,
     * and the form does not need resetting because `@switch` destroyed it on the way into
     * `recorded` — re-entering `editing` constructs a pristine one, `FormGroup` and all.
     *
     * The doctor then picks the next appointment explicitly. Carrying the previous one forward
     * would be the more convenient default and the wrong one: the next examination is almost never
     * for the same patient, and one silently attributed to the previous appointment is a clinical
     * error, not a UX annoyance.
     */
    protected startAnother(): void {
        this.draft.reset();
    }
}
