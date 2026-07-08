import type { UserDto } from '@micro-medic/shared-types';
import { httpClient } from '../http-client';

const BASE = '/api/auth';

export const authService = {
    login: async (email: string, password: string): Promise<{ token: string; user: UserDto }> => {
        return await httpClient.post<{ token: string; user: UserDto }>(`${BASE}/login`, {
            email,
            password,
        });
    },
    logout: async (): Promise<void> => {
        return await httpClient.post<void>(`${BASE}/logout`, {});
    },

    registerPatient: async (patientData: any): Promise<{ token: string; user: UserDto }> => {
        return await httpClient.post<{ token: string; user: UserDto }>(`${BASE}/register-patient`, patientData);
    },

    registerDoctor: async (doctorData: any): Promise<{ token: string; user: UserDto }> => {
        return await httpClient.post<{ token: string; user: UserDto }>(`${BASE}/register-doctor`, doctorData);
    },

    getCurrentUser: async (): Promise<UserDto> => {
        return await httpClient.get<UserDto>(`${BASE}/me`);
    },

    updateProfile: async (userData: { firstname: string; lastname: string; email: string }): Promise<UserDto> => {
        return await httpClient.put<UserDto>(`${BASE}/me`, userData);
    },

    changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
        return await httpClient.put<void>(`${BASE}/me/password`, {
            currentPassword,
            newPassword,
            confirmPassword
        });
    }

}