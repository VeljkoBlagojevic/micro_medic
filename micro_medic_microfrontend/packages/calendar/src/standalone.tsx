import { createRoot } from "react-dom/client";
import { authStore, eventBus } from "@micro-medic/shared-store";
import { EventTypes } from "@micro-medic/shared-types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CalendarApp } from "./CalendarApp";

// Design tokens must be on the page for the Lit components to pick up the theme; the shell
// normally does this, so the standalone harness has to do it itself.
import '@micro-medic/design-system/src/tokens.css';
import '@micro-medic/design-system';

// Standalone dev harness for the calendar MFE (no shell, no Module Federation).

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const host = document.getElementById('calendar-root');
if (host) {
    createRoot(host).render(
        <QueryClientProvider client={queryClient}>
            <CalendarApp />
        </QueryClientProvider>
    );
} else {
    console.error('[calendar] #calendar-root not found — check public/index.html.');
}

const stateEl = document.getElementById('cal-auth-state');
function renderState() {
    if (!stateEl) return;
    const { isAuthenticated, user, role } = authStore.getState();
    stateEl.textContent = isAuthenticated
        ? `Authenticated as ${user?.firstname} ${user?.lastname} (${role})`
        : 'Not authenticated';
}
renderState();
authStore.subscribe(renderState);

const eventEl = document.getElementById('cal-last-event');
eventBus.on(EventTypes.CALENDAR_APPOINTMENT_SELECTED, ({ appointment }) => {
    if (!eventEl) return;
    const patient = appointment.patient
        ? `${appointment.patient.firstname} ${appointment.patient.lastname}`
        : 'unknown patient';
    eventEl.textContent = `Last event: appointment ${appointment.id} — ${patient} at ${appointment.start}`;
});

// Surface in-app notifications, which every mutation emits on success.
eventBus.on(EventTypes.NOTIFICATION_SHOW, ({ message, type }) => {
    console.info(`[notification:${type}] ${message}`);
});

document.getElementById('cal-sim-logout')?.addEventListener('click', () => {
    authStore.logout();
});
