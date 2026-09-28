import apiClient from './client';
import type { ApiResponse, DailyReading, Bookmark } from '../types';

export const bibleApi = {
  getDailyReading: (date?: string) =>
    apiClient.get<ApiResponse<DailyReading>>('/bible/daily-reading', { params: { date } }),

  getBookmarks: () => apiClient.get<ApiResponse<Bookmark[]>>('/bible/bookmarks'),

  /** Saves (or updates) the bookmark for a verse. */
  addBookmark: (verse: Omit<Bookmark, '_id' | 'userId' | 'createdAt'>) =>
    apiClient.post<ApiResponse<Bookmark>>('/bible/bookmarks', verse),

  /** Removes a bookmark by its verse key (e.g. "JHN.3.16") or id. */
  removeBookmark: (verseIdOrId: string) =>
    apiClient.delete(`/bible/bookmarks/${encodeURIComponent(verseIdOrId)}`),
};
