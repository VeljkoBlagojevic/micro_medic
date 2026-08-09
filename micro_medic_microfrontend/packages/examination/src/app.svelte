<script>
  import { onDestroy } from 'svelte';
  import axios from 'axios';

  // Consumed as a Module Federation remote: the remote is named `shared_store` and exposes
  // `./store` as `{ authStore, eventBus }`. The previous `import store from 'store/store'`
  // matched neither the remote name nor its exports, so `store.authToken` was undefined and
  // every request went out unauthenticated.
  import { authStore, eventBus } from 'shared_store/store';

  const API_BASE = 'http://localhost:8080';

  /**
   * Examination form — deliberately Svelte, while the calendar is React and the ICD-10
   * browser is plain JavaScript.
   *
   * The point is that the integration contract is framework-agnostic: single-spa lifecycles
   * for mounting, the shared event bus for messaging, and the `--mm-*` custom properties for
   * theming. Nothing in this file imports from another micro-frontend.
   */

  // Filled by the ICD-10 micro-frontend over the event bus, not by a shared import. The two
  // sit side by side in the horizontal split and stay mutually ignorant.
  let selectedDisease = null;

  let form = {
    scheduledAppointmentId: null,
    medicalHistory: '',
    therapyDescription: ''
  };

  let submitting = false;
  /** `{ kind: 'success' | 'error', text }`, or null when there is nothing to report. */
  let result = null;

  // A doctor picks the appointment in the calendar; this MFE learns of it over the bus and
  // uses its id, since `ExaminationRequest.scheduledAppointmentId` is how the backend
  // reaches the patient (Examination has no direct patient field).
  const offAppointment = eventBus.on('CALENDAR_APPOINTMENT_SELECTED', ({ appointment }) => {
    form.scheduledAppointmentId = appointment.id;
  });

  const offDisease = eventBus.on('ICD10_DISEASE_SELECTED', ({ disease }) => {
    selectedDisease = disease;
  });

  // single-spa unmounts and remounts this application as the route changes; leaking these
  // subscriptions would leave a detached component reacting to bus traffic.
  onDestroy(() => {
    offDisease();
    offAppointment();
  });

  function notify(type, message) {
    result = { kind: type === 'success' ? 'success' : 'error', text: message };
    // Also announce it globally, so a future notification MFE can render toasts without
    // this form knowing anything about it.
    eventBus.emit('NOTIFICATION_SHOW', { message, type });
  }

  async function submit() {
    if (!form.scheduledAppointmentId) {
      notify('warning', 'Select an appointment in the calendar first.');
      return;
    }
    if (!selectedDisease) {
      notify('warning', 'Select a diagnosis from the ICD-10 list first.');
      return;
    }

    submitting = true;
    result = null;

    try {
      const token = authStore.getToken();
      // The request body mirrors `dto/ExaminationRequest` exactly. The old version posted
      // `{ anamnesis, status }` to `/api/v1/examination` — wrong field names, wrong path,
      // and missing the three `@NotBlank` fields, so it could only ever have 400'd.
      const { data } = await axios.post(
        `${API_BASE}/api/examinations`,
        {
          scheduledAppointmentId: form.scheduledAppointmentId,
          // `@PastOrPresent`, so the local clock must not run ahead of the server's. Second
          // precision and no zone suffix: the backend field is a `LocalDateTime`.
          startTime: new Date().toISOString().slice(0, 19),
          medicalHistory: form.medicalHistory,
          diagnosisCode: selectedDisease.code,
          therapyDescription: form.therapyDescription,
          medicineUsages: []
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      notify('success', 'Examination recorded.');
      // Lets the calendar invalidate its cache — the appointment is now examined.
      eventBus.emit('EXAMINATION_COMPLETED', { examinationId: data.id });

      form.medicalHistory = '';
      form.therapyDescription = '';
      selectedDisease = null;
    } catch (error) {
      // `GlobalExceptionHandler` returns `ApiError`, whose `message` is the useful part.
      const message = error?.response?.data?.message ?? 'Could not record the examination.';
      console.error('[examination] Submit failed:', error);
      notify('error', message);
    } finally {
      submitting = false;
    }
  }
</script>

<section class="exam" aria-labelledby="exam-heading">
  <h2 class="exam__heading" id="exam-heading">Examination</h2>

  <form on:submit|preventDefault={submit}>
    <p class="exam__context">
      {#if form.scheduledAppointmentId}
        Appointment #{form.scheduledAppointmentId}
      {:else}
        <span class="exam__hint">Select an appointment in the calendar.</span>
      {/if}
    </p>

    <label class="exam__label" for="exam-anamnesis">Anamnesis</label>
    <textarea
      id="exam-anamnesis"
      class="exam__input"
      rows="5"
      required
      placeholder="What the patient reports…"
      bind:value={form.medicalHistory}
    ></textarea>

    <p class="exam__label">Diagnosis</p>
    <p class="exam__diagnosis" aria-live="polite">
      {#if selectedDisease}
        <strong>{selectedDisease.code}</strong> — {selectedDisease.description}
      {:else}
        <span class="exam__hint">Pick one from the ICD-10 list beside this form.</span>
      {/if}
    </p>

    <label class="exam__label" for="exam-therapy">Therapy</label>
    <textarea
      id="exam-therapy"
      class="exam__input"
      rows="3"
      required
      placeholder="Prescribed therapy and how to take it…"
      bind:value={form.therapyDescription}
    ></textarea>

    <button class="exam__submit" type="submit" disabled={submitting}>
      {submitting ? 'Saving…' : 'Record examination'}
    </button>

    {#if result}
      <p class="exam__result exam__result--{result.kind}" role="status">{result.text}</p>
    {/if}
  </form>
</section>

<style>
  /*
   * Svelte scopes these rules to this component, so they cannot leak into another remote —
   * the same guarantee the Lit components get from their shadow root, by a different
   * mechanism. Values still come from the shared `--mm-*` tokens with literal fallbacks, so
   * this MFE is themed by the shell rather than by its own hardcoded palette.
   */
  .exam {
    display: flex;
    flex-direction: column;
    gap: var(--mm-space-3, 12px);
    padding: var(--mm-space-4, 16px);
    background: var(--mm-color-surface, #fff);
    border: 1px solid var(--mm-color-border, #dee2e6);
    border-radius: var(--mm-radius-md, 8px);
    font-family: var(--mm-font-family, system-ui, sans-serif);
    color: var(--mm-color-text, #212529);
  }

  .exam__heading {
    margin: 0;
    font-size: var(--mm-font-size-lg, 18px);
    font-weight: var(--mm-font-weight-bold, 600);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--mm-space-2, 8px);
  }

  .exam__label {
    margin: var(--mm-space-2, 8px) 0 0;
    font-size: var(--mm-font-size-sm, 14px);
    font-weight: var(--mm-font-weight-medium, 500);
  }

  .exam__input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--mm-space-2, 8px) var(--mm-space-3, 12px);
    font: inherit;
    color: inherit;
    background: var(--mm-color-bg, #f8f9fa);
    border: 1px solid var(--mm-color-border, #dee2e6);
    border-radius: var(--mm-radius-sm, 4px);
    resize: vertical;
  }

  .exam__input:focus-visible {
    outline: 2px solid var(--mm-color-focus-ring, #4c9aff);
    outline-offset: 1px;
    border-color: var(--mm-color-primary, #0d6efd);
  }

  .exam__context,
  .exam__diagnosis {
    margin: 0;
    font-size: var(--mm-font-size-sm, 14px);
  }

  .exam__hint {
    color: var(--mm-color-text-muted, #6c757d);
    font-style: italic;
  }

  .exam__submit {
    margin-top: var(--mm-space-3, 12px);
    padding: var(--mm-space-2, 8px) var(--mm-space-4, 16px);
    font: inherit;
    font-weight: var(--mm-font-weight-medium, 500);
    color: var(--mm-color-on-primary, #fff);
    background: var(--mm-color-primary, #0d6efd);
    border: none;
    border-radius: var(--mm-radius-sm, 4px);
    cursor: pointer;
    transition: background var(--mm-transition-fast, 150ms) var(--mm-transition-timing, ease);
  }

  .exam__submit:hover:not(:disabled) {
    background: var(--mm-color-primary-dark, #0a58ca);
  }

  .exam__submit:disabled {
    background: var(--mm-color-disabled-bg, #adb5bd);
    cursor: not-allowed;
  }

  .exam__result {
    margin: var(--mm-space-2, 8px) 0 0;
    padding: var(--mm-space-2, 8px) var(--mm-space-3, 12px);
    font-size: var(--mm-font-size-sm, 14px);
    border-radius: var(--mm-radius-sm, 4px);
  }

  .exam__result--success {
    color: var(--mm-color-on-success-surface, #0a3622);
    background: var(--mm-color-success-surface, #d1e7dd);
    border: 1px solid var(--mm-color-success-border, #a3cfbb);
  }

  .exam__result--error {
    color: var(--mm-color-on-danger-surface, #58151c);
    background: var(--mm-color-danger-surface, #f8d7da);
    border: 1px solid var(--mm-color-danger-border, #f1aeb5);
  }
</style>
