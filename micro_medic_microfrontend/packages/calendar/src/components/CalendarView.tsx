import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, startOfWeek, getDay } from "date-fns";
import { date, parse } from "zod";
import { enUS } from "date-fns/locale/en-US";
import { CalendarEvent, CalendarViewKind } from "../types";
import { useMemo } from "react";
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
    const eventPropGetter = useMemo(() => {
        return (event: CalendarEvent) => {
            const backgroundColor = getStatusColor(event.status) || "#3174ad"; // Default color if none is provided
            return {
                style: {
                    backgroundColor,
                    borderRadius: "0px",
                    opacity: 0.8,
                    color: "white",
                    border: "0px",
                    display: "block",
                },
            };
        }
    }, []);

    return (
        <div className="cal-grid">
            <Calendar<CalendarEvent>
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                view={view}
                date={date}
                onView={nextView => onView(nextView as CalendarViewKind)}
                onNavigate={onNavigate}
                onSelectEvent={onSelectEvent}
                eventPropGetter={eventPropGetter}
            />
        </div>
    );
}