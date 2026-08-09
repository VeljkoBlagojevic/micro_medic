import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Role, ScheduledAppointmentDto } from "@micro-medic/shared-types";
import { calendarService } from "../services/calendar.service";
import { queryKeys } from "../state";
import { toCalendarEvents } from "../utils";

/**
 * @param viewerRole Drives the event titles only — the backend already scopes
 *   `GET /api/calendar` to the caller, so it is not part of the query key.
 */
export function useCalendar(viewerRole: Role | null) {
    // Memoised so react-query can skip re-running the transform on every render.
    const select = useCallback(
        (appointments: ScheduledAppointmentDto[]) => toCalendarEvents(appointments, viewerRole),
        [viewerRole]
    );

    const query = useQuery({
        queryKey: queryKeys.calendar,
        // The backend scopes `GET /api/calendar` to the caller, so a page size large enough
        // to cover a month's view is requested rather than the default 10.
        queryFn: async () => (await calendarService.list({ page: 0, size: 200 })).content,
        select,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        events: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        // Exposed so the UI can render a specific message instead of a generic failure.
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching
    };
}
