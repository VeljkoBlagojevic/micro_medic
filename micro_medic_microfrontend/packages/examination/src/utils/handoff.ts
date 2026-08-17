import { APPOINTMENT_HANDOFF_PARAM } from '@micro-medic/shared-types';

/**
 * The receiving end of the `calendar` → `examination` handoff.
 *
 * The two micro-frontends are on **disjoint routes**, so single-spa has already unmounted `calendar`
 * by the time this application mounts. The event bus is a live `EventTarget` with no replay
 * (Geers §6.1.5), which makes a bus message between them structurally undeliverable whatever the
 * ordering — so the id travels in the URL instead: `/examination?appointmentId=<id>`. That is durable,
 * bookmarkable, survives a reload, and is re-authorized on arrival.
 *
 * Both functions read and write `window.location` directly rather than taking it as a parameter. This
 * is a browser-composition concern by nature, and the only caller is `ExaminationApp`, the one class
 * that knows it is mounted as a route.
 *
 * The parameter *name* is `APPOINTMENT_HANDOFF_PARAM` from `shared-types`, never a literal here: the
 * writer is in another package, and a disagreement over the spelling is a screen that opens empty
 * with nothing logged anywhere.
 */

/**
 * The appointment id in the current URL, or `null` if there is none to adopt.
 *
 * Validated, not merely parsed. A URL is untrusted input that this package did not write, and
 * `Number('12abc')` is `NaN` while `parseInt('12abc', 10)` is a cheerful `12`. Anything that is not a
 * positive integer is treated as absent, so a mangled link lands on the appointment picker — where
 * the doctor can choose — rather than on a fetch guaranteed to 400. `adoptAppointment` is the layer
 * that reports a *plausible* id the backend refuses; this one only filters out ids no backend could
 * have issued.
 */
export function readAppointmentHandoff(): number | null {
    if (typeof window === 'undefined') return null;

    const raw = new URLSearchParams(window.location.search).get(APPOINTMENT_HANDOFF_PARAM);
    if (raw === null || raw.trim() === '') return null;

    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) return null;

    return id;
}

/**
 * Drops the parameter from the URL without navigating.
 *
 * `history.replaceState`, deliberately: `pushState` would leave the stale handoff one Back press
 * away, and `navigateToUrl`/`location.assign` would make single-spa re-evaluate every activity
 * function — unmounting and remounting this application, and with it the very draft the caller has
 * just reset. Nothing about the *route* is changing here, only a spent parameter on it.
 *
 * Called from `startAnother()`. Once the examination is committed the id points at a `COMPLETED`
 * appointment, which `adoptAppointment` rejects, so leaving it in the URL would turn the next reload
 * into an error the doctor did nothing to cause.
 */
export function clearAppointmentHandoff(): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (!url.searchParams.has(APPOINTMENT_HANDOFF_PARAM)) return;

    url.searchParams.delete(APPOINTMENT_HANDOFF_PARAM);
    // `url.search` is '' once the last parameter goes, which is what keeps a bare '?' off the address
    // bar. The hash is preserved — it is not ours to discard.
    //
    // `null` for the state, which is what every `pushState` in this monorepo passes (see `nav`'s link
    // handler): single-spa carries its routing in the URL and its own events, not in history state, so
    // there is nothing here to preserve.
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}
