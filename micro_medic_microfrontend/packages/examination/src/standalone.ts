import { createComponent } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { eventBus, EventTypes } from '@micro-medic/shared-store';
import type { DiseaseDto } from '@micro-medic/shared-types';
import { ExaminationApp } from './ExaminationApp.js';
import { examinationProviders } from './Examination.js';

// The theme has to be on the page for the Lit components to resolve their `--mm-*` tokens. The
// shell normally loads it; with no shell here, the harness does it itself.
import '@micro-medic/design-system/src/tokens.css';
import '@micro-medic/design-system/src/global.css';

/**
 * Standalone dev harness — no shell, no Module Federation, no ICD-10 remote.
 *
 * It boots the application with `examinationProviders`, the exact array `Examination.ts` uses, so
 * what runs here is the real thing and not a lookalike. What the harness supplies is the *other side
 * of the split*: the buttons below publish `ICD10_DISEASE_SELECTED` exactly as the ICD-10 remote
 * does, which is what makes the coupling testable in isolation. If the diagnosis pane fills in when
 * a button here is pressed, it will fill in when the real remote is beside it — the contract is the
 * event, and nothing else.
 */

const host = document.getElementById('examination-root');
if (!host) {
    console.error('[examination] #examination-root not found — check public/index.html.');
} else {
    // `.then` rather than a top-level `await`: top-level await turns this into an async module, and
    // an async module in the federation shared scope changes how consumers have to import it. The
    // harness is not worth that, and `Examination.ts` needs the same discipline for real.
    void createApplication({ providers: examinationProviders }).then((app) => {
        const ref = createComponent(ExaminationApp, {
            environmentInjector: app.injector,
            hostElement: host,
        });
        app.attachView(ref.hostView);
    });
}

/**
 * Stand-in diagnoses, published on the same event the real remote uses.
 *
 * Real ICD-10 codes, because the backend validates the code against the seeded `disease` table:
 * `ExaminationService.examine` throws for an unknown one. A made-up code would let the form submit
 * happily and fail with a 400 that looks like a bug in this MFE.
 */
const SAMPLE_DISEASES: DiseaseDto[] = [
    { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
    { code: 'I10', description: 'Essential (primary) hypertension' },
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
];

const diseaseHost = document.getElementById('examination-diseases');
SAMPLE_DISEASES.forEach((disease) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = disease.code;
    button.title = disease.description;
    button.addEventListener('click', () => {
        eventBus.emit(EventTypes.ICD10_DISEASE_SELECTED, { disease });
        logEvent(`ICD10_DISEASE_SELECTED — ${disease.code}`);
    });
    diseaseHost?.appendChild(button);
});

/*
 * The events this MFE *publishes*. Watching them is the point of a harness: the calendar only learns
 * that an examination happened through `EXAMINATION_COMPLETED`, so if it does not appear below, no
 * sibling MFE would have reacted either. Same for `NOTIFICATION_SHOW` — there is no `notifications`
 * remote here to render the toasts, and a message that is emitted but never logged is a message the
 * real toast layer would also have missed.
 */
const eventEl = document.getElementById('examination-last-event');
function logEvent(text: string): void {
    if (eventEl) eventEl.textContent = `Last event: ${text}`;
    console.info(`[examination] ${text}`);
}

eventBus.on(EventTypes.EXAMINATION_COMPLETED, ({ examinationId }) => {
    logEvent(`EXAMINATION_COMPLETED — examination #${examinationId}`);
});
eventBus.on(EventTypes.NOTIFICATION_SHOW, ({ type, message }) => {
    logEvent(`NOTIFICATION_SHOW [${type}] ${message}`);
});
