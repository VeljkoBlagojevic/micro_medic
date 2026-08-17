import type { EventType, EventPayloadMap } from '@micro-medic/shared-types';

type PayloadOf<T extends EventType> = T extends keyof EventPayloadMap ? EventPayloadMap[T] : never;

/**
 * The rest-argument tuple of `emit` — empty for a payload-less event, one element otherwise.
 *
 * Exported because a caller that re-declares this conditional cannot forward to `emit`. Two
 * structurally identical conditional types over an *unresolved* generic are not mutually assignable:
 * TypeScript defers both and compares them by reference, so `examination`'s `EventBusService.emit`
 * spelling out the same `extends undefined | void ? [] : [...]` failed to spread into this one
 * (TS2345). Sharing the alias makes them the same type reference, which is what the checker needs.
 */
export type EmitArgs<T extends EventType> =
    PayloadOf<T> extends undefined | void ? [] : [payload: PayloadOf<T>];

type Listener<T extends EventType> = (payload: PayloadOf<T>) => void;

type AnyListener = Listener<EventType>;

/** Detaches a listener. Safe to call more than once. */
export type Unsubscribe = () => void;

/**
 * Read on every call rather than captured once at module load: the flag is usually set
 * from the browser console after the bundle has already been evaluated.
 */
function isDebug(): boolean {
    return typeof window !== 'undefined'
        && !!(window as unknown as { __MICRO_MEDIC_DEBUG__?: boolean }).__MICRO_MEDIC_DEBUG__;
}

/**
 * Typed pub/sub over a private `EventTarget`, used for cross-micro-frontend messaging.
 * Payloads travel on `CustomEvent.detail`, keyed by `EventTypes` from shared-types.
 */
class EventBus {
    private target = new EventTarget();

    /**
     * Wrapper registry, keyed by event name *and then* listener.
     *
     * A single flat listener→wrapper map cannot work: the same function is often
     * registered for several events, and one entry per function lets the last
     * registration overwrite the earlier wrappers, leaving `off()` unable to detach them.
     */
    private wrappers = new Map<EventType, Map<AnyListener, EventListener>>();

    emit<T extends EventType>(event: T, ...args: EmitArgs<T>): void {
        if (isDebug()) {
            console.debug(`[EventBus] Emitting event: ${event}`, ...args);
        }
        this.target.dispatchEvent(new CustomEvent(event, { detail: args[0] }));
    }

    /** Subscribes until the returned function is called. */
    on<T extends EventType>(event: T, listener: Listener<T>): Unsubscribe {
        if (isDebug()) {
            console.debug(`[EventBus] Registering listener for event: ${event}`);
        }

        let forEvent = this.wrappers.get(event);
        if (!forEvent) {
            forEvent = new Map();
            this.wrappers.set(event, forEvent);
        }

        // Registering the same listener twice for one event would leak the first
        // wrapper, so treat it as idempotent and hand back the existing teardown.
        if (forEvent.has(listener as AnyListener)) {
            return () => this.off(event, listener);
        }

        const wrapper: EventListener = (e: Event) => {
            listener((e as CustomEvent).detail as PayloadOf<T>);
        };

        forEvent.set(listener as AnyListener, wrapper);
        this.target.addEventListener(event, wrapper);

        return () => this.off(event, listener);
    }

    off<T extends EventType>(event: T, listener: Listener<T>): void {
        const forEvent = this.wrappers.get(event);
        const wrapper = forEvent?.get(listener as AnyListener);
        if (!forEvent || !wrapper) return;

        if (isDebug()) {
            console.debug(`[EventBus] Unregistering listener for event: ${event}`);
        }

        this.target.removeEventListener(event, wrapper);
        forEvent.delete(listener as AnyListener);
        if (forEvent.size === 0) {
            this.wrappers.delete(event);
        }
    }

    /** Fires at most once. The returned function cancels it if it has not fired yet. */
    once<T extends EventType>(event: T, listener: Listener<T>): Unsubscribe {
        if (isDebug()) {
            console.debug(`[EventBus] Registering one-time listener for event: ${event}`);
        }

        const wrapped: Listener<T> = (payload) => {
            // Detach before invoking so the bookkeeping stays correct even if the
            // listener throws, and so a re-entrant emit cannot call it a second time.
            this.off(event, wrapped);
            listener(payload);
        };

        return this.on(event, wrapped);
    }
}

const globalScope = globalThis as typeof globalThis & { __MICRO_MEDIC_EVENT_BUS__?: EventBus };

/**
 * Single bus shared by every federated bundle — deduped via `globalThis` because
 * Module Federation may still evaluate this module more than once.
 */
export const eventBus = globalScope.__MICRO_MEDIC_EVENT_BUS__ ?? (globalScope.__MICRO_MEDIC_EVENT_BUS__ = new EventBus());

export type { EventBus };
