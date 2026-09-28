import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { churchApi } from '../api/church.api';
import { useAppSelector } from './useAppDispatch';
import { selectChurch } from '../store/slices/auth.slice';

/**
 * Parish-staff data for the in-app admin screens. Every key includes the
 * active parish, and each mutation refreshes the dashboard counts too.
 */
function useParishKey() {
  return useAppSelector(selectChurch)?._id;
}

export function useAdminStats() {
  const church = useParishKey();
  return useQuery({
    queryKey: ['admin', 'stats', church],
    queryFn: async () => (await adminApi.getStats()).data.data,
  });
}

export function useAdminCertificates(status: string) {
  const church = useParishKey();
  return useQuery({
    queryKey: ['admin', 'certificates', church, status],
    queryFn: async () => (await adminApi.getPendingCertificates(status)).data.data,
  });
}

export function useUpdateCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof adminApi.updateCertificate>[1] & { id: string }) => {
      const { id, ...payload } = p;
      return adminApi.updateCertificate(id, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useAdminTransfers() {
  const church = useParishKey();
  return useQuery({
    queryKey: ['admin', 'transfers', church],
    queryFn: async () => (await adminApi.getTransfers()).data.data,
  });
}

export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof adminApi.updateTransfer>[1] & { id: string }) => {
      const { id, ...payload } = p;
      return adminApi.updateTransfer(id, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useAdminFamilies(search: string) {
  const church = useParishKey();
  return useQuery({
    queryKey: ['admin', 'families', church, search],
    queryFn: async () => {
      const res = await adminApi.getFamilies(search);
      return { families: res.data.data, total: res.data.pagination?.total ?? res.data.data.length };
    },
  });
}

export function useAdminDonations(status?: string) {
  const church = useParishKey();
  return useQuery({
    queryKey: ['admin', 'donations', church, status ?? 'all'],
    queryFn: async () => (await adminApi.getDonations({ status, limit: 100 })).data.data,
  });
}

export function useAdminMassTimings() {
  const church = useParishKey();
  return useQuery({
    queryKey: ['admin', 'mass', church],
    queryFn: async () => (await churchApi.getMassTimings()).data.data,
  });
}

export function useRemoveMassTiming() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteMassTiming(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['mass-timings'] });
    },
  });
}

/** "2h ago", "3d ago" for activity feeds. */
export function ago(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function inrShort(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `₹${n}`;
}
