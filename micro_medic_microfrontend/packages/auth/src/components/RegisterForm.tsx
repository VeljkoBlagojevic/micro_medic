import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MmButton, type MmSelectOption } from '@micro-medic/design-system-react';
import { registerSchema, type RegisterFormValues } from '../schemas.js';
import { useSpecializations } from '../hooks/useSpecializations.js';
import { MmFormField } from './MmFormField.js';
import { MmSelectFormField } from './MmSelectFormField.js';

const ROLE_OPTIONS: MmSelectOption[] = [
    { value: 'PATIENT', label: 'Patient' },
    { value: 'DOCTOR', label: 'Doctor' },
];

interface RegisterFormProps {
    submitting: boolean;
    onSubmit: (values: RegisterFormValues) => void;
}

export function RegisterForm({ submitting, onSubmit }: RegisterFormProps) {
    const { control, handleSubmit } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'PATIENT',
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            specializationId: undefined,
        },
    });

    // Subscribing to the one field, rather than `watch()`, so typing in any other field does
    // not re-render the whole form.
    const role = useWatch({ control, name: 'role' });
    const isDoctor = role === 'DOCTOR';

    // The request is only fired once a doctor is actually being registered — a patient never
    // sees the field, so loading the department list for them is wasted work.
    const { specializations, loading, failed } = useSpecializations(isDoctor);

    const specializationOptions: MmSelectOption[] = specializations.map((specialization) => ({
        value: String(specialization.id),
        label: specialization.name,
    }));

    return (
        <form className="auth__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <MmSelectFormField
                control={control}
                name="role"
                label="I am registering as"
                options={ROLE_OPTIONS}
                required
                disabled={submitting}
            />

            <div className="auth__form-row">
                <MmFormField
                    control={control}
                    name="firstName"
                    label="First name"
                    autoComplete="given-name"
                    required
                    disabled={submitting}
                />
                <MmFormField
                    control={control}
                    name="lastName"
                    label="Last name"
                    autoComplete="family-name"
                    required
                    disabled={submitting}
                />
            </div>

            <MmFormField
                control={control}
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                required
                disabled={submitting}
            />

            {isDoctor &&
                (failed ? (
                    // Degraded path: the department list could not be fetched, so fall back to
                    // the raw id rather than blocking registration behind an empty select.
                    <MmFormField
                        control={control}
                        name="specializationId"
                        label="Specialization department id"
                        type="number"
                        hint="Department list unavailable — enter the numeric id."
                        required
                        disabled={submitting}
                    />
                ) : (
                    <MmSelectFormField
                        control={control}
                        name="specializationId"
                        label="Specialization"
                        placeholder={loading ? 'Loading departments…' : 'Select a department'}
                        options={specializationOptions}
                        hint="Populated from the backend's specialization departments."
                        numeric
                        required
                        disabled={submitting || loading}
                    />
                ))}

            <MmFormField
                control={control}
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                hint="At least 8 characters."
                required
                disabled={submitting}
            />

            <MmFormField
                control={control}
                name="confirmPassword"
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                required
                disabled={submitting}
            />

            <MmButton
                type="submit"
                variant="primary"
                fullWidth
                loading={submitting}
                label="Creating account"
            >
                Create account
            </MmButton>
        </form>
    );
}
