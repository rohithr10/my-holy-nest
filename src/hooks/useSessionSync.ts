import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user.api';
import { churchApi } from '../api/church.api';
import { syncBookmarks } from '../utils/bookmarkSync';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { selectChurch, selectIsAuthenticated, setChurch, updateUser } from '../store/slices/auth.slice';

/**
 * Keeps the signed-in session in step with the server:
 *  - refreshes the stored profile from /users/me (role, name, parish may have
 *    changed — e.g. after a completed church transfer);
 *  - makes the app's active parish the user's own. The server scopes every
 *    signed-in request to the parish on the account, so showing the parish
 *    picked during onboarding instead would label another parish's data.
 */
export function useSessionSync() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const church = useAppSelector(selectChurch);

  const me = useQuery({
    queryKey: ['me'],
    enabled: isAuthenticated,
    queryFn: async () => (await userApi.getMe()).data.data,
    staleTime: 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  useEffect(() => {
    if (me.data) dispatch(updateUser(me.data));
  }, [me.data, dispatch]);

  // Bring this phone's Bible bookmarks and the account's together once per sign-in.
  const userId = me.data?._id;
  useEffect(() => {
    if (userId) void syncBookmarks();
  }, [userId]);

  const churchId = me.data?.churchId;
  useEffect(() => {
    if (!churchId || church?._id === churchId) return;
    let cancelled = false;
    churchApi
      .getById(churchId)
      .then(res => {
        if (!cancelled) dispatch(setChurch(res.data.data));
      })
      .catch(() => {
        /* keep the current parish; retried on the next profile refresh */
      });
    return () => {
      cancelled = true;
    };
  }, [churchId, church?._id, dispatch]);
}
