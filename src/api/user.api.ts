import apiClient from './client';
import type { ApiResponse, User } from '../types';

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
  gender?: 'M' | 'F' | 'other';
}

export interface PreferencesUpdate {
  language?: 'en' | 'ta';
  notifications?: Partial<User['preferences']['notifications']>;
}

export const userApi = {
  getMe: () => apiClient.get<ApiResponse<User>>('/users/me'),

  updateMe: (data: ProfileUpdate) => apiClient.patch<ApiResponse<User>>('/users/me', data),

  updatePreferences: (data: PreferencesUpdate) =>
    apiClient.patch<ApiResponse<User>>('/users/me/preferences', data),
};
