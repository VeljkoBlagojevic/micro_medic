import { createRoot } from "react-dom/client";
import { eventBus } from "@micro-medic/shared-store";
import { authStore } from "@micro-medic/shared-store/src/auth-store";
import { EventTypes } from "@micro-medic/shared-types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CalendarApp } from "./CalendarApp";

import '@micro-medic/design-system/src/styles/shared.styles';
import '@micro-medic/design-system';

// Standalone dev harness for calendar MFE (no shell, no Module Federation)

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
}

const stateEl = document.getElementById('cal-auth-state');
function renderState() {
    if (!stateEl) return;
    const s = authStore.getState();
    stateEl.textContent = s.isAuthenticated ? `Authenticated as ${s.user?.firstname} ${s.user?.lastname}` : 'Not authenticated';
}
renderState();
authStore.subscribe(renderState);

const eventEl = document.getElementById('cal-last-event');
eventBus.on(EventTypes.CALENDAR_APPOINTMENT_SELECTED, (event) => {
    if (!eventEl) return;
    eventEl.textContent = `Last event: ${event.appointment} for appointment ${event.appointment.id}`;
});

document.getElementById('cal-sim-logout')?.addEventListener('click', () => {
    authStore.logout();
});
    
