import type { NotificationPayload } from '@micro-medic/shared-types';

/**
 * How long a notification stays on screen, by type.
 *
 * This is the policy this micro-frontend exists to own. `mm-toast-region` takes a duration per
 * toast and has no opinion about what it should be — correctly, because "how long is a warning
 * worth" is a product decision, not a presentational one. Putting it here means every micro-frontend
 * gets the same answer without any of them having to know it: an emitter says *what happened*, and
 * this package decides how insistently to say it.
 *
 * `null` means "until dismissed". Failures are sticky on purpose — a toast that says the save did
 * not happen and then disappears after four seconds is worse than no toast, because the user is
 * left believing it did. Warnings sit longer than confirmations for the same reason, scaled down:
 * they usually carry something to act on, while "Appointment booked" only confirms what the user
 * just did and has the screen behind it as evidence.
 */
const DURATIONS: Record<NotificationPayload['type'], number | null> = {
    error: null,
    warning: 8000,
    info: 5000,
    success: 4000,
};

/**
 * The duration for a payload: the emitter's own value if it supplied one, otherwise the policy.
 *
 * An emitter may override, because it occasionally knows something this table cannot — a toast
 * accompanying a redirect, say. `0` is honoured as "sticky" rather than treated as absent, which is
 * why this checks for `undefined` explicitly instead of using `??` on a falsy value.
 */
export function durationFor(payload: NotificationPayload): number | null {
    return payload.duration === undefined ? DURATIONS[payload.type] : payload.duration;
}
