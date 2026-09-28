import apiClient from './client';
import type { ApiResponse, AppNotification } from '../types';

/**
 * Notifications API — the signed-in user's own notifications (certificate and
 * transfer updates, donation receipts, parish announcements and events).
 */
export const notificationApi = {
  getNotifications: () =>
    apiClient.get<ApiResponse<AppNotification[]>>('/notifications'),

  markAsRead: (id: string) =>
    apiClient.patch<ApiResponse<AppNotification>>(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.patch<ApiResponse<null>>('/notifications/read-all'),
};
