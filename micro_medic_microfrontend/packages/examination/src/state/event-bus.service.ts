import { DestroyRef, Injectable, inject } from '@angular/core';
import { eventBus, EventTypes, type EmitArgs } from '@micro-medic/shared-store';
import type { EventPayloadMap, EventType } from '@micro-medic/shared-types';

/**
 * Injectable wrapper over the cross-micro-frontend event bus.
 *
 * The bus itself is a module singleton deduped through `globalThis`, so this class adds no state —
 * what it adds is *lifetime*. Every subscription made through `listen` is torn down when the
 * injector that asked for it is destroyed, which is the one thing a raw `eventBus.on(...)` in a
 * component cannot guarantee. single-spa unmounts and remounts this application on every route
 * change, and a leaked listener would leave a destroyed component reacting to bus traffic —
 * exactly the "every toast appears twice" bug the custom-element MFEs guard against.
 *
 * Note what is *not* here: no `Observable`. The bus hands out an unsubscribe function and the
 * consumers below want a callback, so wrapping it in an `rxjs` `Subject` would add a layer whose
 * only job is to be unwrapped again.
 */
@Injectable({ providedIn: 'root' })
export class EventBusService {
    private readonly destroyRef = inject(DestroyRef);

    /**
     * Subscribes for as long as the calling injection context lives.
     *
     * Must be called from an injection context (a constructor or a field initialiser), since it
     * captures `DestroyRef` at construction.
     */
    listen<T extends EventType>(
        event: T,
        listener: (payload: EventPayloadMap[T]) => void
    ): void {
        const unsubscribe = eventBus.on(event, listener);
        this.destroyRef.onDestroy(unsubscribe);
    }

    /**
     * `EmitArgs<T>` is imported rather than re-declared. Spelling the same conditional out here left
     * two deferred conditional types the checker compares by reference and refuses to spread into
     * one another — see the alias's own comment in `shared-store`.
     */
    emit<T extends EventType>(event: T, ...args: EmitArgs<T>): void {
        eventBus.emit(event, ...args);
    }

    /**
     * Publishes a toast.
     *
     * Fire-and-forget by design: the `notifications` MFE owns the duration table and the region's
     * shadow DOM, and this package neither knows nor cares whether anything is listening. One
     * published while that MFE is unmounted is simply lost — the bus is a live channel, not a
     * queue — which is why an error is *also* rendered inline by the form rather than only
     * announced here.
     */
    notify(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
        this.emit(EventTypes.NOTIFICATION_SHOW, { message, type });
    }
}
