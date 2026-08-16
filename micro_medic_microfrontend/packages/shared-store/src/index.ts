export * from './auth-store';
export * from './event-bus';

/*
 * `./session-channel` is deliberately not exported. It is how the auth store talks to its own copies in
 * the other tabs, and the store is its only legitimate publisher: a second one could announce a sign-in
 * this document never had, which is the multi-writer problem `authContext` exists to prevent — one hop
 * further out, where the receiving tab cannot see who sent it.
 */

/**
 * Re-exported so a consumer of the bus never has to also depend on `@micro-medic/shared-types` to
 * name an event — a typo in a hand-written string is a listener that silently never fires.
 *
 * This used to exist for the shell specifically, which had no ts-loader and could reach neither
 * package except as the `shared_store` federated remote. The shell is TypeScript now and that remote
 * is gone; the re-export stays because `eventBus.on` and its keys belong together.
 */
export { EventTypes } from '@micro-medic/shared-types';
export type { EventType, EventPayloadMap } from '@micro-medic/shared-types';
