import { z } from "zod";
import { parseLocalDateTime } from "./utils";

const MAX_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Values are `datetime-local` strings (`yyyy-MM-ddTHH:mm`), not `Date`s — that is what the
 * input emits and what the backend's `LocalDateTime` expects after `:00` is appended.
 *
 * The cross-field rules use object-level `.refine`s with explicit `path`s so react-hook-form
 * attaches each message to the right field.
 */
const localDateTime = z
    .string()
    .min(1, { message: "Required" })
    .refine((value) => parseLocalDateTime(value) !== null, {
        message: "Must be a valid date and time",
    });

type TimeRange = { start: string; end: string };

const timeOf = (value: string): number | null => parseLocalDateTime(value)?.getTime() ?? null;

const startInFuture = ({ start }: TimeRange) => {
    const startTime = timeOf(start);
    return startTime === null || startTime > Date.now();
};

const endAfterStart = ({ start, end }: TimeRange) => {
    const startTime = timeOf(start);
    const endTime = timeOf(end);
    // Skip when either side is unparseable — the field-level check already reports that, and
    // coercing a bad value to 0 produced a second, misleading error.
    if (startTime === null || endTime === null) return true;
    return endTime > startTime;
};

const withinMaxDuration = ({ start, end }: TimeRange) => {
    const startTime = timeOf(start);
    const endTime = timeOf(end);
    if (startTime === null || endTime === null) return true;
    return endTime - startTime <= MAX_DURATION_MS;
};

/*
 * Each `refine` needs an explicit `path`, or the issue lands at the object root and
 * react-hook-form has no field to attach the message to.
 *
 * No `as const` on `path`: zod 4 types it as a mutable `PropertyKey[]`, so a readonly tuple is
 * not assignable.
 */
const START_IN_FUTURE = {
    message: "Start time must be in the future",
    path: ["start"],
};
const END_AFTER_START = {
    message: "End time must be after the start time",
    path: ["end"],
};
const MAX_DURATION = {
    message: "An appointment cannot be longer than 2 hours",
    path: ["end"],
};

export const bookingSchema = z
    .object({
        patientId: z
            .number({ message: "Select a patient" })
            .int()
            .positive({ message: "Select a patient" }),
        start: localDateTime,
        end: localDateTime,
    })
    .refine(startInFuture, START_IN_FUTURE)
    .refine(endAfterStart, END_AFTER_START)
    .refine(withinMaxDuration, MAX_DURATION);

export const rescheduleSchema = z
    .object({
        start: localDateTime,
        end: localDateTime,
    })
    .refine(startInFuture, START_IN_FUTURE)
    .refine(endAfterStart, END_AFTER_START)
    .refine(withinMaxDuration, MAX_DURATION);

export type BookingSchema = z.infer<typeof bookingSchema>;
export type RescheduleSchema = z.infer<typeof rescheduleSchema>;
