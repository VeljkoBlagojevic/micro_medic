import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventBus } from '@micro-medic/shared-store';
import { EventTypes } from '@micro-medic/shared-types';
import { queryKeys } from '../state';

/**
 * Keeps the calendar honest about examinations recorded by the `examination` MFE, which flip the
 * appointment to `COMPLETED` server-side. Stale rows keep offering Reschedule, Cancel and Record
 * examination for a visit the backend now rejects.
 *
 * `EXAMINATION_COMPLETED` alone cannot deliver that: the two MFEs are on disjoint routes, so this
 * one is unmounted when the event fires and the bus has no replay. The durable half is therefore the
 * invalidation on mount — "what did I miss?" is the consumer's own problem — which also covers
 * out-of-band changes (another tab, a second clinician). The staleness was real because the
 * `QueryClient` is module-scoped and `useCalendar` sets a five-minute `staleTime`.
 *
 * The subscription stays: it costs one listener and is the right mechanism the day a screen mounts
 * both fragments.
 */
export function useExaminationSync(): void {
    const queryClient = useQueryClient();

    useEffect(() => {
        const invalidate = () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.calendar }).catch((error: unknown) => {
                // Swallowing would leave the list quietly stale; there is nothing to retry from
                // here, so the failure is at least visible to whoever is looking.
                console.error('[calendar] Failed to refresh appointments:', error);
            });
        };

        // Catches everything missed while unmounted. Runs after `useCalendar` has subscribed, so the
        // refetch lands on a mounted query rather than only marking the cache stale.
        invalidate();

        // `eventBus.on` returns its own unsubscribe, so this cleanup is the whole teardown.
        return eventBus.on(EventTypes.EXAMINATION_COMPLETED, invalidate);
    }, [queryClient]);
}
