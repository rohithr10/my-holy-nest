import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { Config } from '../constants/config';
import { store } from '../store';
import { logout, selectToken, setTokens } from '../store/slices/auth.slice';
import { setBookmarks } from '../store/slices/bible.slice';
import { clearSession } from '../utils/session';
import { queryClient } from './queryClient';

const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = selectToken(state);
    const church = state.auth.church;

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (church?._id) config.headers['X-Church-ID'] = church._id;
    return config;
  },
  error => Promise.reject(error),
);

// ── Silent refresh on 401 ──
// A single in-flight refresh is shared by all queued requests.
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = store.getState().auth.refreshToken;
  if (!refreshToken) return null;
  try {
    // Bare axios call to avoid recursing through this interceptor.
    const res = await axios.post(`${Config.API_BASE_URL}/auth/refresh-token`, { refreshToken });
    const data = res.data?.data;
    if (data?.token) {
      store.dispatch(setTokens({ token: data.token, refreshToken: data.refreshToken }));
      return data.token as string;
    }
    return null;
  } catch {
    return null;
  }
}

async function forceLogout() {
  store.dispatch(logout());
  store.dispatch(setBookmarks([]));
  queryClient.clear();
  await clearSession();
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // Don't try to refresh for the auth endpoints themselves.
    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      if (!refreshPromise) refreshPromise = performRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${newToken}` };
        return apiClient(original);
      }
      await forceLogout();
    }
    return Promise.reject(error);
  },
);

/** Extracts a human-readable message from an API/axios error. */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const ax = err as AxiosError<{ message?: string }>;
  return ax?.response?.data?.message ?? ax?.message ?? fallback;
}

export default apiClient;
