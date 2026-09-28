import { store } from '../store';
import { logout } from '../store/slices/auth.slice';
import { setBookmarks } from '../store/slices/bible.slice';
import { authApi } from '../api/auth.api';
import { queryClient } from '../api/queryClient';
import { clearSession } from './session';

/**
 * Signs the user out everywhere this device knows about: revokes the refresh
 * token on the server (best effort — a dead connection must not trap the user
 * signed in), then clears the stored session and every cached query.
 */
export async function signOut(): Promise<void> {
  const refreshToken = store.getState().auth.refreshToken;
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {
      /* offline or already revoked — sign out locally regardless */
    }
  }
  store.dispatch(logout());
  // Bookmarks are personal and sync to whoever signs in next — don't carry them over.
  store.dispatch(setBookmarks([]));
  queryClient.clear();
  await clearSession();
}
