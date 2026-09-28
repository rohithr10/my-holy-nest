import { useQuery } from '@tanstack/react-query';
import { donationApi } from '../api/donation.api';
import { useAppSelector } from './useAppDispatch';
import { selectUser } from '../store/slices/auth.slice';
import type { Donation, OfferingType } from '../types';

export const OFFERING_LABEL: Record<OfferingType, string> = {
  offering: 'Offering',
  mass_intention: 'Mass Offering',
  building_fund: 'Building Fund',
  charity: 'Charity',
  scholarship: 'Scholarship Fund',
  subscription: 'Monthly Subscription',
  special: 'Special Offering',
};

export const METHOD_LABEL: Record<NonNullable<Donation['method']>, string> = {
  online: 'Online',
  cash: 'Cash',
  cheque: 'Cheque',
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
};

/** The user's donations (newest first) — online and those recorded at the office. */
export function useDonationHistory() {
  const user = useAppSelector(selectUser);
  return useQuery({
    queryKey: ['donations', user?._id],
    enabled: !!user,
    queryFn: async () => (await donationApi.getHistory(1, 100)).data.data,
  });
}

/** Completed giving for one calendar year, with count/average/highest. */
export function useGivingForYear(year: number) {
  const history = useDonationHistory();
  const done = (history.data ?? []).filter(
    d =>
      d.status === 'completed' &&
      new Date(d.processedAt ?? d.createdAt).getFullYear() === year,
  );
  const total = done.reduce((sum, d) => sum + d.amount, 0);
  return {
    ...history,
    donations: done,
    total,
    count: done.length,
    average: done.length ? Math.round(total / done.length) : 0,
    highest: done.reduce((max, d) => Math.max(max, d.amount), 0),
  };
}

export function inr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function donationDate(d: Donation): string {
  return new Date(d.processedAt ?? d.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
