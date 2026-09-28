import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { churchApi } from '../api/church.api';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { selectChurch } from '../store/slices/auth.slice';
import {
  selectAnnouncements,
  setAnnouncements,
} from '../store/slices/church.slice';
import type { Announcement } from '../types';

/**
 * Loads the parish's announcements from `/announcements` — the same list the
 * admin dashboard publishes to — and mirrors them into the church slice so
 * Home, the drawer list and the Admin screen all read one source.
 *
 * The request is scoped by the X-Church-ID header the api client sets from the
 * selected church, so it only runs once a church is chosen. On failure the
 * store's cached list (restored from storage on launch) keeps rendering, so a
 * cold backend or a dropped connection never blanks the screen.
 */
export function useAnnouncements() {
  const dispatch = useAppDispatch();
  const church = useAppSelector(selectChurch);
  const cached = useAppSelector(selectAnnouncements);

  const query = useQuery({
    queryKey: ['announcements', church?._id],
    enabled: !!church?._id,
    queryFn: async (): Promise<Announcement[]> => {
      const res = await churchApi.getAnnouncements();
      return res.data.data;
    },
    retry: false,
    // Announcements are the one list members expect to be current the moment
    // they open the screen, so always refetch rather than serve a stale cache.
    staleTime: 0,
  });

  useEffect(() => {
    if (query.data) dispatch(setAnnouncements(query.data));
  }, [query.data, dispatch]);

  return {
    announcements: query.data ?? cached,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    usingCached: !query.data,
  };
}
