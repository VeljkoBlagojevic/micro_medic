import { authStore, eventBus } from '@micro-medic/shared-store';
import { EventTypes, Role, type NotificationPayload } from '@micro-medic/shared-types';

// Registers `<notification-center>`, which registers the design system in turn.
import './notification-center.js';

// The `--mm-*` tokens the toasts read, plus the document styles this page's own markup uses. The
// shell loads these in the real application, so the harness has to do it itself — and this is the
// one place in this package where importing them is correct.
import '@micro-medic/design-system/src/global.css';

/**
 * Standalone dev harness for the `notifications` MFE — no shell, no Module Federation, no single-spa.
 *
 * This MFE has no UI of its own to develop, so the harness is not a preview: it is a *test bench for
 * the contract*. Everything this package does is a reaction to events published by other
 * micro-frontends, and in the composed application those come from `calendar`, `auth` and
 * `examination`. Here the buttons stand in for all three, which makes the interesting behaviours
 * reachable without running the whole application or provoking a real API failure:
 *
 *   - a failure toast stays until dismissed while the others expire (`durations.ts`);
 *   - re-emitting the same `id` replaces the toast in place rather than stacking a duplicate;
 *   - the fifth toast drops the oldest, so one MFE in a retry loop cannot cover the screen;
 *   - a logout clears the stack, because those messages belong to the session that ended.
 */

const TYPES: Array<NotificationPayload['type']> = ['success', 'info', 'warning', 'error'];

const MESSAGES: Record<NotificationPayload['type'], string> = {
    success: 'Appointment booked for 14 May, 10:30.',
    info: 'Reference data refreshed.',
    warning: 'This slot overlaps another appointment for the same patient.',
    error: 'Could not save the examination — the server rejected the diagnosis code.',
};

document.querySelectorAll<HTMLElement>('[data-harness-notify]').forEach((button) => {
    button.addEventListener('click', () => {
        const type = (button.dataset.harnessNotify ?? 'info') as NotificationPayload['type'];
        eventBus.emit(EventTypes.NOTIFICATION_SHOW, { message: MESSAGES[type], type });
    });
});

/*
 * The same id every time, so repeated clicks demonstrate replacement rather than stacking. This is
 * the shape a real "still reconnecting" or progress notification takes.
 */
let attempt = 0;
document.querySelector('[data-harness-sticky]')?.addEventListener('click', () => {
    attempt += 1;
    eventBus.emit(EventTypes.NOTIFICATION_SHOW, {
        id: 'connection',
        message: `Reconnecting to the server… (attempt ${attempt})`,
        type: 'warning',
        // An explicit override beating the policy table: this one is only true until the next
        // attempt replaces it.
        duration: 0,
    });
});

// Overflow: five at once against a cap of four, so the oldest is visibly dropped.
document.querySelector('[data-harness-flood]')?.addEventListener('click', () => {
    for (let i = 1; i <= 5; i += 1) {
        eventBus.emit(EventTypes.NOTIFICATION_SHOW, {
            message: `Queued job ${i} of 5 finished.`,
            type: TYPES[i % TYPES.length]!,
        });
    }
});

/*
 * A real logout through the store, not a bare `eventBus.emit(AUTH_LOGOUT)`: the store is what emits
 * that event in the application, and going through it exercises the same path.
 */
document.querySelector('[data-harness-logout]')?.addEventListener('click', () => {
    authStore.login('dev-token', {
        id: 1,
        firstname: 'Ana',
        lastname: 'Marić',
        email: 'ana@example.org',
        role: Role.DOCTOR,
    });
    authStore.logout();
});

// Trace what came back out. A dismissal that emits nothing looks exactly like one that was never
// wired up, and this is the half of the contract an emitter would rely on.
eventBus.on(EventTypes.NOTIFICATION_DISMISSED, ({ id }) => {
    console.info(`[notifications:harness] NOTIFICATION_DISMISSED ${id}`);
});
