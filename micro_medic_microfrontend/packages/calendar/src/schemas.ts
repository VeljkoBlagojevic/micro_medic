import { z } from "zod";
import { parseLocalDateTime } from "./utils";

const MAX_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const startInFuture = (v: {start:string}) => {
    return (parseLocalDateTime(v.start)?.getTime() ?? 0) > Date.now();
}
const endAfterStart = (v: {start:string, end:string}) => {
    const startTime = parseLocalDateTime(v.start)?.getTime() ?? 0;
    const endTime = parseLocalDateTime(v.end)?.getTime() ?? 0;
    return endTime > startTime;
}

const withinMaxDuration = (v: {start:string, end:string}) => {
    const startTime = parseLocalDateTime(v.start)?.getTime() ?? 0;
    const endTime = parseLocalDateTime(v.end)?.getTime() ?? 0;
    return (endTime - startTime) <= MAX_DURATION_MS;
}

export const bookingSchema = z.object({
    patientId: z.number().int().positive({ message: "Patient ID must be a positive integer" }),
    start: z.string().refine((val) => parseLocalDateTime(val) !== null, {
        message: "Start time must be a valid local date-time string",
    }),
    end: z.string().refine((val) => parseLocalDateTime(val) !== null, {
        message: "End time must be a valid local date-time string",
    }),
}).refine(startInFuture, {
    message: "Start time must be in the future",
    path: ["start"]
}).refine(endAfterStart, {
    message: "End time must be after start time",
    path: ["end"]
}).refine(withinMaxDuration, {
    message: "Appointment duration must not exceed 2 hours",
    path: ["end"]
});

export const rescheduleSchema = z.object({
    start: z.string().refine((val) => parseLocalDateTime(val) !== null, {
        message: "Start time must be a valid local date-time string",
    }),
    end: z.string().refine((val) => parseLocalDateTime(val) !== null, {
        message: "End time must be a valid local date-time string",
    }),
}).refine(startInFuture, {
    message: "Start time must be in the future",
    path: ["start"]
}).refine(endAfterStart, {
    message: "End time must be after start time",
    path: ["end"]
}).refine(withinMaxDuration, {
    message: "Appointment duration must not exceed 2 hours",
    path: ["end"]
});

export type BookingSchema = z.infer<typeof bookingSchema>;
export type RescheduleSchema = z.infer<typeof rescheduleSchema>;