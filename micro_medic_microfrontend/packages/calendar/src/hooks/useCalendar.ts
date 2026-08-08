import { useQuery } from "@tanstack/react-query";
import { calendarService } from "../services/calendar.service";
import { queryKeys } from "../state";
import { toCalendarEvents } from "../utils";

export function useCalendar() {
    const query = useQuery({
        queryKey: queryKeys.calendar,
        queryFn: async () => (await calendarService.list()).content,
        select: toCalendarEvents,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        events: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
        isFetching: query.isFetching
    }
};
    