import apiClient from './client';
import type { ApiResponse, User } from '../types';

export type OtpPurpose = 'login' | 'register' | 'reset' | 'verify';

export interface LoginPayload { phone: string; password: string }
export interface OTPPayload { phone: string; otp: string }
export interface RegisterPayload {
  phone: string;
  password: string;
  familyName: string;
  firstName: string;
  lastName?: string;
  email?: string;
  churchId: string;
  address: { street: string; area?: string; city: string; state?: string; pincode: string };
}

type AuthResult = { token: string; refreshToken: string; user: User };

export const authApi = {
  sendOTP: (phone: string, purpose: OtpPurpose = 'login') =>
    apiClient.post<ApiResponse<{ message: string; devCode?: string }>>('/auth/send-otp', {
      phone,
      purpose,
    }),

  // OTP login for an existing account
  verifyOTP: (payload: OTPPayload) =>
    apiClient.post<ApiResponse<AuthResult>>('/auth/verify-otp', payload),

  // OTP verification right after registration
  verifyAccount: (payload: OTPPayload) =>
    apiClient.post<ApiResponse<AuthResult>>('/auth/verify-account', payload),

  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<AuthResult>>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<{ userId: string; familyId: string; devCode?: string }>>(
      '/auth/register',
      payload,
    ),

  refreshToken: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh-token', {
      refreshToken,
    }),

  logout: (refreshToken?: string) => apiClient.post('/auth/logout', { refreshToken }),

  forgotPassword: (phone: string) =>
    apiClient.post<ApiResponse<{ message: string; devCode?: string }>>('/auth/forgot-password', {
      phone,
    }),

  resetPassword: (payload: { phone: string; otp: string; newPassword: string }) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', payload),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', payload),
};
