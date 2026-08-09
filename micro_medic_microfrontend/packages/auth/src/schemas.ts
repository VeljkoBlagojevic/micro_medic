import { z } from 'zod';

/**
 * Mirrors the backend's Bean Validation constraints, so the form rejects what the server
 * would reject anyway and the user finds out before the round trip.
 *
 * `dto/auth/LoginRequest` and `RegisterRequest` both declare `@Email` and
 * `@Size(min = 8)` on the password, so the 8-character minimum is a real contract, not a
 * UI preference. Keep the two in step — a looser rule here just moves the error to a 400.
 */
const MIN_PASSWORD_LENGTH = 8;

const email = z
    .string()
    .min(1, { message: 'Email is required' })
    // `@Email` on the backend; `z.email()` is the zod 4 spelling (`z.string().email()` is
    // deprecated).
    .pipe(z.email({ message: 'Enter a valid email address' }));

const password = z
    .string()
    .min(1, { message: 'Password is required' })
    .min(MIN_PASSWORD_LENGTH, {
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    });

export const loginSchema = z.object({
    email,
    // Deliberately not the full `password` rule: an existing account may predate the
    // constraint, and telling someone their *current* password is too short at the login
    // form is unhelpful. Length is the server's business here.
    password: z.string().min(1, { message: 'Password is required' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * `RegisterRequest` uses `firstName`/`lastName` — capital N, unlike the `firstname`/
 * `lastname` on every response DTO. The mismatch is real and load-bearing: send the
 * lowercase spelling and Jackson silently leaves both fields null, tripping `@NotBlank`.
 */
const registerBase = z.object({
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    email,
    password,
    confirmPassword: z.string().min(1, { message: 'Confirm your password' }),
});

/**
 * Which of the two `/api/auth/register*` endpoints the form targets.
 *
 * `Role.PATIENT` / `Role.DOCTOR` from `shared-types` are these exact strings; spelled as
 * literals here so the schema does not admit `ADMIN` or `NURSE`, neither of which can
 * self-register (an admin is seeded by `V5`, and there is no nurse endpoint at all).
 */
export const registrableRoles = ['PATIENT', 'DOCTOR'] as const;

export type RegistrableRole = (typeof registrableRoles)[number];

/**
 * Both registration variants in one schema, discriminated by `role`.
 *
 * Two separate schemas would need two `useForm` instances, and switching between them would
 * either remount the form — throwing away everything already typed — or require swapping the
 * resolver on a single form, whose value type then only matches one of the two. Keeping `role`
 * *inside* the form means one resolver, one value type, and the doctor-only requirement
 * expressed as what it actually is: a cross-field rule.
 *
 * `specializationId` is optional at the field level and required by the `.refine` below, which
 * is the only way to make "required, but only for doctors" produce a message on the field
 * itself rather than a type error for patients.
 */
const registerObject = registerBase.extend({
    role: z.enum(registrableRoles),
    // A plain `z.number()`, not `z.coerce.number()`: `MmSelectFormField`'s `numeric` flag
    // already converts the element's string to a number and maps "nothing selected" to
    // `undefined`. Coercing here would turn that `undefined` into `NaN` and surface zod's
    // "expected number, received nan" instead of the message below.
    specializationId: z.number().int().positive().optional(),
});

/**
 * `confirmPassword` and `role` are UI-only — both are stripped before the request is sent,
 * because `RegisterRequest` has neither field.
 *
 * Each `.refine` carries an explicit `path`, or the issue lands at the object root and
 * react-hook-form has no field to attach the message to.
 */
export const registerSchema = registerObject
    .refine((values) => values.password === values.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })
    .refine((values) => values.role !== 'DOCTOR' || values.specializationId !== undefined, {
        message: 'Select a specialization',
        path: ['specializationId'],
    });

export type RegisterFormValues = z.infer<typeof registerObject>;
