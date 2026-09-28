import apiClient from './client';
import type {
  ApiResponse,
  MassTiming,
  Announcement,
  CertificateRequest,
  TransferRequest,
  Donation,
  Family,
} from '../types';

/**
 * Admin actions are role-guarded on the resource routes themselves
 * (not a separate /admin namespace). The backend authorises staff roles
 * via the JWT, so these hit the same endpoints with admin privileges.
 */
export interface AdminStats {
  church: { id: string; name: string; code: string } | null;
  stats: {
    totalFamilies: number;
    totalMembers: number;
    pendingCertificates: number;
    pendingTransfers: number;
    upcomingEvents: number;
    announcements: number;
    donationsThisMonth: number;
    donationsYearToDate: number;
  };
  activity: { type: 'certificate' | 'donation' | 'transfer'; text: string; at: string }[];
}

/** A transfer as the admin queue returns it: populated, with this parish's allowed actions. */
export type AdminTransfer = Omit<TransferRequest, 'familyId'> & {
  familyId: { _id: string; familyName?: string; cardNumber?: string } | string;
  actions?: ('approved_source' | 'pending_destination' | 'completed' | 'rejected')[];
};

export const adminApi = {
  getStats: () => apiClient.get<ApiResponse<AdminStats>>('/admin/stats'),

  getFamilies: (search?: string, page = 1) =>
    apiClient.get<ApiResponse<Family[]>>('/families', { params: { search: search || undefined, page } }),

  getDonations: (params?: { status?: string; type?: string; page?: number; limit?: number }) =>
    apiClient.get<
      ApiResponse<{
        donations: (Omit<Donation, 'userId'> & {
          donorName?: string;
          userId?: { profile?: { firstName?: string; lastName?: string }; phone?: string } | string;
        })[];
        totals: { amount: number; count: number };
      }>
    >('/donations', { params }),

  // ── Mass timings ──
  addMassTiming: (data: Partial<MassTiming>) =>
    apiClient.post<ApiResponse<MassTiming>>('/mass/timings', data),

  updateMassTiming: (id: string, data: Partial<MassTiming>) =>
    apiClient.patch<ApiResponse<MassTiming>>(`/mass/timings/${id}`, data),

  deleteMassTiming: (id: string) => apiClient.delete(`/mass/timings/${id}`),

  // ── Certificates queue ──
  getPendingCertificates: (status = 'pending') =>
    apiClient.get<ApiResponse<CertificateRequest[]>>('/certificates', {
      params: { status: status || undefined, limit: 100 },
    }),

  updateCertificate: (
    id: string,
    payload: {
      status: 'under_review' | 'approved' | 'rejected' | 'ready';
      certificateUrl?: string;
      certificateNumber?: string;
      rejectionReason?: string;
    },
  ) => apiClient.patch<ApiResponse<CertificateRequest>>(`/certificates/${id}/status`, payload),

  // ── Transfers queue ──
  getTransfers: () => apiClient.get<ApiResponse<AdminTransfer[]>>('/transfers'),

  updateTransfer: (
    id: string,
    payload: {
      status: 'approved_source' | 'pending_destination' | 'completed' | 'rejected';
      rejectionReason?: string;
    },
  ) => apiClient.patch(`/transfers/${id}/status`, payload),

  // ── Announcements ──
  // churchId is derived server-side from the X-Church-ID header, so it is not
  // part of the payload.
  postAnnouncement: (data: Omit<Announcement, '_id' | 'publishedAt' | 'churchId'>) =>
    apiClient.post<ApiResponse<Announcement>>('/announcements', data),

  deleteAnnouncement: (id: string) => apiClient.delete(`/announcements/${id}`),
};
