import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../api/notification.api';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  markNotificationRead,
  markNotificationsRead,
  selectLocalNotifications,
  selectReadNotificationIds,
} from '../store/slices/notification.slice';
import { selectUser } from '../store/slices/auth.slice';
import type { AppNotification } from '../types';

/**
 * Loads the user's notifications from the API and exposes read-state helpers.
 *
 * Read-state is kept in the store as well as on the server, so the Home bell
 * badge and the Notifications screen update together the moment something is
 * opened; the matching API call is fired best-effort.
 */
export function useNotifications() {
  const dispatch = useAppDispatch();
  const readIds = useAppSelector(selectReadNotificationIds);
  const localNotifications = useAppSelector(selectLocalNotifications);

  const user = useAppSelector(selectUser);
  const query = useQuery({
    queryKey: ['notifications', user?._id],
    enabled: !!user,
    queryFn: async (): Promise<AppNotification[]> => {
      const res = await notificationApi.getNotifications();
      return res.data.data;
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const remote: AppNotification[] = useMemo(() => query.data ?? [], [query.data]);

  // App-generated notifications (subscription receipts, new announcements)
  // sit alongside the server's, newest first.
  const source = useMemo(
    () =>
      [...localNotifications, ...remote].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [localNotifications, remote],
  );

  const notifications = useMemo(() => {
    const read = new Set(readIds);
    return source.map(n => (read.has(n._id) ? { ...n, read: true } : n));
  }, [source, readIds]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications],
  );

  const markAsRead = useCallback(
    (id: string) => {
      dispatch(markNotificationRead(id));
      notificationApi.markAsRead(id).catch(() => {});
    },
    [dispatch],
  );

  const markAllAsRead = useCallback(() => {
    dispatch(markNotificationsRead(source.map(n => n._id)));
    notificationApi.markAllAsRead().catch(() => {});
  }, [dispatch, source]);

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    isError: query.isError,
    markAsRead,
    markAllAsRead,
  };
}

/** Builds an in-app notification with a unique id and the current timestamp. */
export function buildLocalNotification(
  input: Omit<AppNotification, '_id' | 'createdAt' | 'read'> &
    Partial<Pick<AppNotification, '_id' | 'createdAt' | 'read'>>,
): AppNotification {
  return {
    ...input,
    _id:
      input._id ??
      `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: input.createdAt ?? new Date().toISOString(),
    read: input.read ?? false,
  };
}
