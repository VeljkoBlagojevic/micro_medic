import type { EventType, EventPayloadMap } from '@micro-medic/shared-types';

type PayloadOf<T extends EventType> = T extends keyof EventPayloadMap ? EventPayloadMap[T] : never;

type Listener<T extends EventType> = (payload: PayloadOf<T>) => void;

const DEBUG =
    typeof window !== 'undefined' && (window as unknown as { __MICRO_MEDIC_DEBUG__: boolean }).__MICRO_MEDIC_DEBUG__;

class EventBus {
    private target = new EventTarget();

    private wrappers = new WeakMap<Listener<EventType>, EventListener>();

    emit<T extends EventType>(
        event: T,
        ...args: PayloadOf<T> extends undefined ? [] : [payload: PayloadOf<T>]
    ): void {
        if (DEBUG) {
            console.debug(`[EventBus] Emitting event: ${event}`, ...args);
        }
        const payload = args[0] as PayloadOf<T>;
        const customEvent = new CustomEvent(event, { detail: payload });
        this.target.dispatchEvent(customEvent);
    }

    on<T extends EventType>(event: T, listener: Listener<T>): void {
        if (DEBUG) {
            console.debug(`[EventBus] Registering listener for event: ${event}`);
        }
        const wrapper = (e: Event) => {
            const payload = (e as CustomEvent).detail;
            listener(payload);
        };
        this.wrappers.set(listener as Listener<EventType>, wrapper);
        this.target.addEventListener(event, wrapper);
    }

    off<T extends EventType>(event: T, listener: Listener<T>): void {
        if (DEBUG) {
            console.debug(`[EventBus] Unregistering listener for event: ${event}`);
        }
        const wrapper = this.wrappers.get(listener as Listener<EventType>);
        if (wrapper) {
            this.target.removeEventListener(event, wrapper);
            this.wrappers.delete(listener as Listener<EventType>);
        }
    }

    once<T extends EventType>(event: T, listener: Listener<T>): void {
        if (DEBUG) {
            console.debug(`[EventBus] Registering one-time listener for event: ${event}`);
        }
        const unsubscribe = () => {
            this.on(event, (payload) => {
                unsubscribe();
                listener(payload);
            });
            return unsubscribe;
        }
    }

}

const globalScope = globalThis as typeof globalThis & { __MICRO_MEDIC_EVENT_BUS__?: EventBus };

export const eventBus = globalScope.__MICRO_MEDIC_EVENT_BUS__ ?? (globalScope.__MICRO_MEDIC_EVENT_BUS__ = new EventBus());
