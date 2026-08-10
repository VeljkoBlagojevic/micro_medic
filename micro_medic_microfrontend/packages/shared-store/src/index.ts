export * from './auth-store';
export * from './event-bus';

/**
 * Re-exported so a consumer never has to hand-write an event name.
 *
 * `EventTypes` lives in `@micro-medic/shared-types`, which ships raw `.ts` and is resolved
 * through a `paths` entry — fine for the TypeScript packages, but the shell has no ts-loader and
 * cannot import it at all. It consumes this package as the `shared_store` federated remote, so
 * routing the constant through here is what lets it write `EventTypes.AUTH_LOGOUT` instead of the
 * string `'AUTH_LOGOUT'` — and a typo in a string is a listener that silently never fires. (`nav`
 * and `icd10` were the other two consumers of this indirection; both are TypeScript now and import
 * from `shared-types` directly, but the re-export stays for the shell and costs nothing.)
 */
export { EventTypes } from '@micro-medic/shared-types';
export type { EventType, EventPayloadMap } from '@micro-medic/shared-types';
