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

    registerPatient: async (patientData: any): Promise<UserDto> => {
        return await httpClient.post<UserDto>(`${BASE}/register-patient`, patientData);
    },

    registerDoctor: async (doctorData: any): Promise<UserDto> => {
        return await httpClient.post<UserDto>(`${BASE}/register-doctor`, doctorData);
    },

    getCurrentUser: async (): Promise<UserDto> => {
        return await httpClient.get<UserDto>(`${BASE}/me`);
    },

    updateProfile: async (userData: any): Promise<UserDto> => {
        return await httpClient.put<UserDto>(`${BASE}/update-profile`, userData);
    },

    changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        return await httpClient.post<void>(`${BASE}/change-password`, {
            oldPassword,
            newPassword,
        });
    }

}