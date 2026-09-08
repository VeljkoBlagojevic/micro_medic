import { useCallback, useState } from 'react';
import type { CalendarViewKind } from '../types';

export function useCalendarView(initialView: CalendarViewKind = 'day') {
    const [view, setView] = useState<CalendarViewKind>(initialView);
    const [date, setDate] = useState<Date>(() => new Date());

    const onView = useCallback((newView: CalendarViewKind) => {
        setView(newView);
    }, []);

    const onNavigate = useCallback((newDate: Date) => {
        setDate(newDate);
    }, []);

    return {
        view,
        date,
        onView,
        onNavigate
    };
}
