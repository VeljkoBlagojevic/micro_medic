/**
 * Cross-**tab** session propagation over a named `BroadcastChannel`.
 *
 * This is not cross-micro-frontend communication: every micro-frontend in one document already shares
 * the auth store and the event bus. What it carries is a session change to the *other tabs* of the
 * same origin — sign in on one, and the rest stop showing a signed-out app bar over a form full of
 * patient data.
 *
 * **Deliberately not exported from the package index.** `auth-store` is the only legitimate publisher:
 * a second one could announce a sign-in this document never had, and every listening tab would believe
 * it. Keeping the module unexported is what makes that structural rather than a convention.
 *
 * It is also **not** a fallback for the `window` `storage` event — `auth-store` installs both, and
 * they observe different things. The channel observes the store's *intent* ("a sign-out happened"),
 * so it stays correct when the keys could not be written; `storage` observes the *medium*, so it is
 * the only one that notices those keys being changed by code that never called this store. Neither
 * subsumes the other, and double delivery is harmless because `applyExternalSession` is
 * change-guarded.
 */

/**
 * The whole protocol: which of the two things happened.
 *
 * Only the *kind* of change travels, never a token or a `UserDto`. Two reasons, and both matter. A
 * `BroadcastChannel` message is structured-cloned into every same-origin tab, so a token on it is a
 * credential copied into contexts that did not ask for one. And the receiver already has the
 * authoritative copy: `signed-in` is answered by re-reading `localStorage`, which is the medium both
 * tabs share. `signed-out` needs no read at all, which is exactly its value — it clears the receiving
 * tab even when the publishing tab could not remove the keys.
 */
export interface SessionMessage {
    type: 'signed-in' | 'signed-out';
}

/**
 * The publish half of an open channel.
 *
 * There is no `close()`: the auth store is a `globalThis`-deduped singleton that lives as long as the
 * document, so a teardown method here would be an unexercised claim. Add one when something genuinely
 * needs to stop listening.
 */
export interface SessionChannel {
    publish(message: SessionMessage): void;
}

/**
 * Namespaced, because the channel name is a global key on the origin. An unprefixed `session` would
 * collide with anything else served from the same host.
 */
const CHANNEL_NAME = 'micro_medic:session';

/** Rejects anything on the channel that is not one of the two messages we defined. */
function isSessionMessage(value: unknown): value is SessionMessage {
    if (typeof value !== 'object' || value === null) return false;
    const { type } = value as { type?: unknown };
    return type === 'signed-in' || type === 'signed-out';
}

/**
 * Subscribes to session changes from other tabs and returns the publish half.
 *
 * Returns `null` when there is no `BroadcastChannel` — a non-DOM context, or a browser without it.
 * That is why every call site publishes optionally (`sessionChannel?.publish(...)`): a missing channel
 * degrades to "this tab keeps its own session correct and tells nobody", which is the same behaviour
 * the app had before the channel existed. Throwing here would take the store's construction — and
 * therefore the `configureApiClient` bootstrap, and therefore every request in the document — down
 * over a feature that only improves other tabs.
 *
 * A `BroadcastChannel` never delivers to the object that posted, so `publish` cannot re-enter
 * `onMessage`. Nor is there a second instance in this document to hear it: the store is deduped
 * through `globalThis`, so there is exactly one channel per document however many federated copies of
 * this module webpack evaluates.
 */
export function openSessionChannel(
    onMessage: (message: SessionMessage) => void
): SessionChannel | null {
    if (typeof BroadcastChannel === 'undefined') return null;

    let channel: BroadcastChannel;
    try {
        channel = new BroadcastChannel(CHANNEL_NAME);
    } catch (error) {
        // Blocked by a storage-partitioning or privacy setting. Same reasoning as above: the local
        // session is still correct, so report and carry on rather than fail the bootstrap.
        console.warn('[SessionChannel] Could not open the session channel:', error);
        return null;
    }

    channel.addEventListener('message', (event: MessageEvent<unknown>) => {
        // Validated rather than cast. The name is a global key on the origin, so another script on the
        // same host can post whatever it likes here, and this handler's job is to clear a session.
        if (isSessionMessage(event.data)) onMessage(event.data);
    });

    return {
        publish(message: SessionMessage): void {
            try {
                channel.postMessage(message);
            } catch (error) {
                // A closed or errored channel must not break a sign-in that has already succeeded
                // locally. The other tabs fall back to the `storage` observer.
                console.warn('[SessionChannel] Could not publish a session message:', error);
            }
        },
    };
}
