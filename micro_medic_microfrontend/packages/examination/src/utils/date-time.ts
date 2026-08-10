import type { LocalDateTimeString } from '@micro-medic/shared-types';

/**
 * Conversions between the backend's `LocalDateTime` wire format and what an `<input
 * type="datetime-local">` reads and writes.
 *
 * The whole file exists because of one asymmetry: the backend serialises
 * `java.time.LocalDateTime` with **no offset** (`2026-08-08T10:30:00`), which means "wall-clock
 * time as the server means it". `new Date(...)` parses that as *local* time — which is what we
 * want — but `Date.prototype.toISOString()` converts to UTC and appends a `Z`, so round-tripping
 * a value through it shifts every timestamp by the viewer's offset and appends a suffix Jackson
 * will not accept. Every function here goes through the local getters instead.
 */

/** Zero-pads to the width `LocalDateTime` expects. */
function pad(value: number, length = 2): string {
    return String(value).padStart(length, '0');
}

/**
 * Formats a `Date` as the backend's offset-free `LocalDateTime`, to second precision.
 *
 * Second precision, not millisecond: Jackson parses both, but the extra digits are noise in a
 * field a human filled in, and they make two logically equal timestamps compare unequal.
 */
export function toLocalDateTimeString(date: Date): LocalDateTimeString {
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

/**
 * Formats a `Date` for an `<input type="datetime-local">`, whose value format is
 * `yyyy-MM-ddTHH:mm` — **minutes only**. Passing a value with seconds makes some browsers show
 * a seconds spinner and others reject the value outright, leaving the field mysteriously blank.
 */
export function toDateTimeLocalInput(date: Date): string {
    return toLocalDateTimeString(date).slice(0, 16);
}

/**
 * Parses either format back into a `Date`, or `null` if it is not a valid timestamp.
 *
 * Returning `null` rather than an `Invalid Date` forces the caller to handle the failure: an
 * invalid `Date` propagates silently through arithmetic and only surfaces as `NaN` much later.
 */
export function parseLocalDateTime(value: string | null | undefined): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Normalises a `datetime-local` field into a submittable `LocalDateTime`, clamped to now.
 *
 * The clamp is what stops a valid-looking form from being rejected by `@PastOrPresent`. The form
 * tolerates a small forward skew (a client clock a few seconds ahead of the server's is normal),
 * and this is where that tolerance is paid for: anything at or after "now" is submitted as
 * exactly now, so the server never sees a future instant.
 */
export function toSubmittableStartTime(value: string): LocalDateTimeString {
    const parsed = parseLocalDateTime(value);
    const now = new Date();
    if (!parsed || parsed.getTime() > now.getTime()) return toLocalDateTimeString(now);
    return toLocalDateTimeString(parsed);
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });

/** Display format for a timestamp. Falls back to an em dash so a table cell is never blank. */
export function formatDateTime(value: LocalDateTimeString | null | undefined): string {
    const parsed = parseLocalDateTime(value);
    return parsed ? DATE_TIME_FORMAT.format(parsed) : '—';
}

export function formatTime(value: LocalDateTimeString | null | undefined): string {
    const parsed = parseLocalDateTime(value);
    return parsed ? TIME_FORMAT.format(parsed) : '—';
}

/** `10:30 – 11:00` for an appointment slot, or a single time if the end is missing. */
export function formatTimeRange(
    start: LocalDateTimeString | null | undefined,
    end: LocalDateTimeString | null | undefined
): string {
    const from = formatDateTime(start);
    const to = formatTime(end);
    return to === '—' ? from : `${from} – ${to}`;
}

/** Whole minutes between two timestamps, or `null` if either is unparseable. */
export function durationInMinutes(
    start: LocalDateTimeString | null | undefined,
    end: LocalDateTimeString | null | undefined
): number | null {
    const from = parseLocalDateTime(start);
    const to = parseLocalDateTime(end);
    if (!from || !to) return null;
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
}
