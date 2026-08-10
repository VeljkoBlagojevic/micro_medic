import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventBus } from '@micro-medic/shared-store';
import { EventTypes } from '@micro-medic/shared-types';
import { queryKeys } from '../state';

/**
 * The calendar's one *inbound* coupling: refresh when a sibling micro-frontend records an
 * examination.
 *
 * `ExaminationService.examine` flips the appointment to `COMPLETED` in the same transaction that
 * saves the examination, and `ExaminationDraftStore.completeSubmit` publishes
 * `EXAMINATION_COMPLETED` once the POST returns. Without this listener the calendar never hears
 * about it: `useCalendar` has a five-minute `staleTime`, so an appointment the doctor just examined
 * keeps rendering "Scheduled" — and `AppointmentCard` keeps offering Reschedule and Cancel for a
 * visit that has already happened, both of which the backend now rejects on the appointment's
 * status. Long enough to be seen, which is worse than an obvious failure.
 *
 * Invalidate rather than patch the cached DTO from the payload. The payload carries only
 * `examinationId`, and the appointment's authoritative post-examination state is the server's;
 * writing a guessed `status: COMPLETED` into the cache would be this package inferring another
 * service's transaction. It is also the same recovery every mutation in `useAppointmentMutations`
 * uses, so there is one refresh path rather than two.
 *
 * Mounted for every viewer, not just doctors: a patient's calendar goes stale for exactly the same
 * reason, and the event says nothing about who is watching.
 */
export function useExaminationSync(): void {
    const queryClient = useQueryClient();

    useEffect(() => {
        // `eventBus.on` returns its own unsubscribe, so the effect's cleanup is the whole teardown.
        // It matters here: single-spa unmounts this application on every navigation away from
        // `/calendar`, and a leaked listener would invalidate a query client belonging to a
        // React tree that no longer exists.
        return eventBus.on(EventTypes.EXAMINATION_COMPLETED, () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.calendar }).catch((error: unknown) => {
                // Swallowing would leave the list quietly stale; there is nothing to retry from
                // here, so the failure is at least visible to whoever is looking.
                console.error('[calendar] Failed to refresh after an examination was recorded:', error);
            });
        });
    }, [queryClient]);
}
