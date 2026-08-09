import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MmButton } from '@micro-medic/design-system-react';
import { loginSchema, type LoginFormValues } from '../schemas.js';
import { MmFormField } from './MmFormField.js';

interface LoginFormProps {
    submitting: boolean;
    onSubmit: (values: LoginFormValues) => void;
}

export function LoginForm({ submitting, onSubmit }: LoginFormProps) {
    const { control, handleSubmit } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    return (
        <form className="auth__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <MmFormField
                control={control}
                name="email"
                label="Email"
                type="email"
                placeholder="doctor@micromedic.rs"
                autoComplete="email"
                required
                disabled={submitting}
            />

            <MmFormField
                control={control}
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                disabled={submitting}
            />

            {/*
              `type="submit"` works because `mm-button` finds the enclosing `<form>` and calls
              `requestSubmit()` itself — its inner button lives in a shadow root and so is not
              form-associated. Relying on that keeps Enter-to-submit working too.
            */}
            <MmButton type="submit" variant="primary" fullWidth loading={submitting} label="Signing in">
                Sign in
            </MmButton>
        </form>
    );
}
