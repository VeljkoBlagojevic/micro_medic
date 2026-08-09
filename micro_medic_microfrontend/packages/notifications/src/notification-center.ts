import { defineElement, type MmToastRegion } from '@micro-medic/design-system';
// Side-effect import: registers `mm-toast-region` (and every other `mm-*` element) so the tag
// created below is a real component rather than an inert unknown element.
import '@micro-medic/design-system';
import { eventBus } from '@micro-medic/shared-store';
import { EventTypes, type NotificationPayload } from '@micro-medic/shared-types';
import { durationFor } from './durations.js';

/**
 * The application's notification layer: the event bus on one side, `mm-toast-region` on the other.
 *
 * This is the whole micro-frontend, and its smallness is the point. Everything about how a toast
 * *looks and behaves* — the four surface treatments, `role="alert"` versus `role="status"`, the
 * stacking, the cap, the auto-dismiss timers, the z-index — belongs to the design system, because
 * any framework's consumer may want it. What is left is the part that is specific to *this
 * application*: which bus events become toasts, how long each type lives (`durations.ts`), and what
 * a logout does to messages already on screen. That is application wiring, and it is why this is an
 * MFE rather than a component.
 *
 * ### Why this is not part of `nav`
 *
 * It was, briefly, and the route table gave it away. The chrome is suppressed on `/login` and
 * `/register` (`exceptRoutes` in `home/src/routes.js`) while a failed-login toast has to appear on
 * exactly those routes — so the toast layer needed to be a separate single-spa application anyway,
 * with a different activity function. A fragment with its own route contract, its own set of
 * consumers (every MFE that emits, versus the one team that owns the chrome) and its own reason to
 * change is a different micro-frontend. Bundled into the header it would also have inherited the
 * header's deploy cadence for no reason.
 *
 * ### Why a custom element and not a React component
 *
 * The same reason as `nav`: this is mounted on every route, so any framework runtime it pulled in
 * would be paid for on first paint by every visitor, and there is no state here worth a framework —
 * one subscription and one method call. It also keeps the layer usable by any MFE regardless of
 * stack, which is the property the whole repo is trying to demonstrate.
 *
 * ### Fire-and-forget, deliberately
 *
 * A notification published while this application is unmounted is *lost*, and that is correct
 * rather than a gap. The bus is a live channel, not a queue: replaying a five-minute-old "Saved"
 * toast on the next mount would be worse than dropping it. The emitters treat notifying as
 * fire-and-forget — see `calendar/src/hooks/useAppointmentMutations.ts` — and none of them waits for
 * an acknowledgement.
 */
export class NotificationCenter extends HTMLElement {
    /**
     * The region, created once in the constructor rather than per mount.
     *
     * It is a field so that `show()` can be called against a known element instead of a
     * `querySelector` that may return `null`. Timers live in the region, and it clears them in its
     * own `disconnectedCallback`, so moving this element in and out of the DOM is safe.
     */
    private readonly region: MmToastRegion = document.createElement('mm-toast-region');

    private teardowns: Array<() => void> = [];

    constructor() {
        super();
        this.region.placement = 'top-right';
        this.region.max = 4;

        /*
         * A toast leaving the region — clicked, expired, or dismissed programmatically — is
         * republished on the bus as `NOTIFICATION_DISMISSED`.
         *
         * Nothing subscribes to it today, and it is still worth emitting: it is the half of the
         * contract that lets an emitter correlate. An MFE that shows a sticky "Reconnecting…" toast
         * with a known id needs to learn that the user dismissed it, and the alternative — reaching
         * for this element across the MFE boundary — is exactly the coupling the bus exists to
         * prevent.
         */
        this.region.addEventListener('mm-toast-dismiss', (event: Event) => {
            const { id } = (event as CustomEvent<{ id: string }>).detail;
            eventBus.emit(EventTypes.NOTIFICATION_DISMISSED, { id });
        });
    }

    connectedCallback(): void {
        /*
         * The host is a plain wrapper with no layout of its own — the region inside it is
         * `position: fixed`, so it is positioned against the viewport regardless of where the shell
         * mounts this. That is the reason this MFE needs no mount point in a particular place, and
         * why the shell can give it the last div in the body.
         */
        if (!this.region.isConnected) {
            this.appendChild(this.region);
        }

        /*
         * Subscribing here rather than at module scope: `connectedCallback` runs on every mount, and
         * an element moved in the DOM is disconnected and reconnected, so this can run more than
         * once. Guarding by tearing down first keeps that idempotent — a second subscription would
         * show every toast twice, which is the classic symptom of this bug.
         */
        this.unsubscribe();

        this.teardowns = [
            eventBus.on(EventTypes.NOTIFICATION_SHOW, this.onNotification),
            /*
             * A logout wipes the stack. The messages on screen are about the session that just
             * ended — "Appointment cancelled", or worse, an error naming a patient — and leaving
             * them over the login screen would keep one user's data visible to the next.
             */
            eventBus.on(EventTypes.AUTH_LOGOUT, this.onLogout),
        ];
    }

    disconnectedCallback(): void {
        // Without this the subscription outlives the element: the bus holds a strong reference to
        // the listener, so every mount/unmount cycle would leak one and multiply the toasts.
        this.unsubscribe();
    }

    private readonly onNotification = (payload: NotificationPayload): void => {
        // Defensive: the payload crosses an MFE boundary, so it is the emitter's type contract
        // rather than a checked one at runtime. A blank toast is a puzzle to debug from a
        // screenshot; a console warning names the culprit.
        if (!payload?.message) {
            console.warn('[notifications] Ignoring a NOTIFICATION_SHOW with no message:', payload);
            return;
        }

        this.region.show({
            id: payload.id,
            message: payload.message,
            type: payload.type,
            duration: durationFor(payload),
        });
    };

    private readonly onLogout = (): void => {
        // `clear()` rather than dismissing each: it emits nothing, and a burst of
        // `NOTIFICATION_DISMISSED` events during a logout would be noise no emitter can act on.
        this.region.clear();
    };

    private unsubscribe(): void {
        for (const teardown of this.teardowns) {
            teardown();
        }
        this.teardowns = [];
    }
}

defineElement('notification-center', NotificationCenter);

declare global {
    interface HTMLElementTagNameMap {
        'notification-center': NotificationCenter;
    }
}
