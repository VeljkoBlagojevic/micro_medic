import { Calendar, dateFnsLocalizer } from "react-big-calendar";
// `parse` must come from date-fns — it was previously imported from `zod`, whose `parse` has
// an entirely different signature, so every date the localizer tried to parse threw.
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { type CalendarEvent, type CalendarViewKind } from "../types";
import { useCallback } from "react";
import { getStatusColor } from "../utils";

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales: {
        'en-US': enUS,
    },
});

/** react-big-calendar's `views` prop; kept module-level so it is referentially stable. */
const VIEWS: CalendarViewKind[] = ['day', 'week', 'month'];

interface CalendarViewProps {
    events: CalendarEvent[];
    view: CalendarViewKind;
    date: Date;
    onView: (view: CalendarViewKind) => void;
    onNavigate: (date: Date) => void;
    onSelectEvent: (event: CalendarEvent) => void;
}

export const CalendarView = ({
    events,
    view,
    date,
    onView,
    onNavigate,
    onSelectEvent,
}: CalendarViewProps) => {
    const eventPropGetter = useCallback(
        (event: CalendarEvent) => ({
            style: {
                backgroundColor: getStatusColor(event.status),
                borderRadius: 'var(--mm-radius-sm, 4px)',
                border: '0',
                color: 'var(--mm-color-on-status, #fff)',
                display: 'block',
            },
        }),
        []
    );

    const titleAccessor = useCallback((event: CalendarEvent) => event.title, []);

    return (
        // `cal-grid` was a `display: grid` with auto-fill columns, which fights
        // react-big-calendar's own layout — the calendar needs a plain block container.
        <div className="cal-calendar">
            <Calendar<CalendarEvent>
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                titleAccessor={titleAccessor}
                style={{ height: '100%', minHeight: 500 }}
                view={view}
                views={VIEWS}
                date={date}
                onView={(nextView) => onView(nextView as CalendarViewKind)}
                onNavigate={onNavigate}
                onSelectEvent={onSelectEvent}
                eventPropGetter={eventPropGetter}
                popup
            />
        </div>
    );
};
