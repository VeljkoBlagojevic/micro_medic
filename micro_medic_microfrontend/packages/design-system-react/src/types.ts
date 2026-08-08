/**
 * Payload types for the custom events surfaced as React props.
 *
 * `@lit/react` hands the raw `CustomEvent` to the callback, so a consumer needs to reach into
 * `event.detail`. These aliases keep that read type-safe instead of `any`.
 */

export interface MmValueDetail {
    value: string;
    name: string;
}

/** `onInput` / `onChange` / `onBlur` from `<MmInput>`. */
export type MmInputEvent = CustomEvent<MmValueDetail>;

/** `onRowClick` from `<MmTable>`. */
export type MmRowClickEvent<TRow = Record<string, unknown>> = CustomEvent<{ row: TRow }>;

/** Convenience reader so callers do not repeat the `detail` dance. */
export function valueOf(event: MmInputEvent): string {
    return event.detail?.value ?? '';
}
