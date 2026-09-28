import { QueryClient } from '@tanstack/react-query';

/**
 * The app's single react-query cache. Exported so sign-out can clear it —
 * otherwise the next account to sign in on the phone would briefly see the
 * previous family's card, certificates and donations.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 5 * 60 * 1000 } },
});
