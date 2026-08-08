import type {
    AuthenticationResponseDto,
    ChangePasswordRequest,
    DoctorRegisterRequest,
    PatientRegisterRequest,
    UpdateProfileRequest,
    UserDto
} from '@micro-medic/shared-types';
import { httpClient } from '../http-client';

const BASE = '/api/auth';

/**
 * Mirrors `auth/AuthenticationController`.
 *
 * The register paths are camelCase (`/registerDoctor`, `/registerPatient`) — together
 * with `/login` they are the only `permitAll` POST matchers in `SecurityConfiguration`,
 * so a hyphenated spelling would 403 (unauthenticated) rather than 404.
 *
 * There is deliberately no `logout`: auth is stateless JWT, the backend exposes no
 * logout endpoint, and `authStore.logout()` simply discards the token client-side.
 */
export const authService = {
    login(email: string, password: string): Promise<AuthenticationResponseDto> {
        return httpClient.post<AuthenticationResponseDto>(`${BASE}/login`, { email, password });
    },

    registerPatient(patient: PatientRegisterRequest): Promise<AuthenticationResponseDto> {
        return httpClient.post<AuthenticationResponseDto>(`${BASE}/registerPatient`, patient);
    },

    registerDoctor(doctor: DoctorRegisterRequest): Promise<AuthenticationResponseDto> {
        return httpClient.post<AuthenticationResponseDto>(`${BASE}/registerDoctor`, doctor);
    },

    getCurrentUser(): Promise<UserDto> {
        return httpClient.get<UserDto>(`${BASE}/me`);
    },

    updateProfile(profile: UpdateProfileRequest): Promise<UserDto> {
        return httpClient.put<UserDto>(`${BASE}/me`, profile);
    },

    /** Returns 204 No Content, hence `void`. */
    changePassword(request: ChangePasswordRequest): Promise<void> {
        return httpClient.put<void>(`${BASE}/me/password`, request);
    }
};
