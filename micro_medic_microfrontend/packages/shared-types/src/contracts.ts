/**
 * Cross-micro-frontend strings that are *not* bus events.
 *
 * The test for what belongs here is whether a violation is **silent**. Both constants below are
 * spelled at two ends that share no code, and a disagreement between those ends produces no error
 * anywhere: a sign-out button that stops working, or a form that opens empty. Nothing throws,
 * nothing logs, and neither package can detect the other's typo. A shared constant turns that into
 * a compile error, which is the only reason these two are worth a module of their own.
 *
 * Importing this does **not** undo `nav`'s independence. What `nav` sheds is `shared-store` — shared
 * *mutable state* — and it has always declared `shared-types`. A string constant has no state to
 * disagree about; that is the whole point.
 *
 * Two neighbouring strings are deliberately **absent**:
 *
 * - The `/examination` route. Routing is the shell's alone, and a route constant here would let a
 *   remote believe it has a say in composition. A wrong path is also a blank screen found on the
 *   first click — loud, not silent, so it fails the test above.
 * - `mm-main`, the skip-link target. Its other end is an `id` attribute in `home/public/index.html`,
 *   which no TypeScript declaration can reach, so a constant would guard only one side of the pair
 *   and imply a guarantee it does not give.
 */

/**
 * Fragment → parent: the event `nav` dispatches when the user presses sign out (Geers §6.1.2).
 *
 * `nav-app-bar` dispatches it `bubbles: true, composed: true` and the shell listens on `window`,
 * answering with the one `authStore.logout()` in the composition root. `nav` itself holds no write
 * capability over session state — the session reaches it as attributes, and this event is how it
 * asks for a change rather than making one.
 *
 * Namespaced (`nav:`) because it travels on `window`, where an unprefixed `sign-out` would collide
 * with anything else on the page.
 */
export const NAV_SIGN_OUT_EVENT = 'nav:sign-out';

/**
 * The query parameter carrying an appointment id from `calendar` to `examination`.
 *
 * This handoff crosses a **mount boundary**: the two micro-frontends live on disjoint routes, so
 * single-spa has unmounted `calendar` before `examination` mounts. The event bus is a live
 * `EventTarget` with no replay (Geers §6.1.5), which makes a bus message between them structurally
 * undeliverable whatever the ordering — hence the URL, which is durable, bookmarkable, survives a
 * reload, and is re-authorized on arrival by `AccessGuard`.
 *
 * `calendar` writes it from the explicit "Record examination" button in `AppointmentCard`;
 * `examination` reads it in `utils/handoff.ts` and resolves it through `adoptAppointment`.
 */
export const APPOINTMENT_HANDOFF_PARAM = 'appointmentId';
