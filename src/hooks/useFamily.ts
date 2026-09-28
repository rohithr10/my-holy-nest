import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { familyApi, type MemberInput } from '../api/family.api';
import { useAppSelector } from './useAppDispatch';
import { selectUser } from '../store/slices/auth.slice';
import type { CertType, Family } from '../types';

/**
 * Family card data from the API. Every key includes the signed-in user's id so
 * one account's cached card can never be shown to the next.
 */
export const familyKeys = {
  card: (uid?: string) => ['family', uid] as const,
  certificates: (uid?: string) => ['certificates', uid] as const,
  transfers: (uid?: string) => ['transfers', uid] as const,
};

export function useMyFamily() {
  const user = useAppSelector(selectUser);
  const query = useQuery({
    queryKey: familyKeys.card(user?._id),
    enabled: !!user,
    queryFn: async () => (await familyApi.getMyCard()).data.data,
  });
  const family = query.data;
  return {
    ...query,
    family,
    /** Only the head can change the card; members can view it. */
    isHead: !!family && !!user && String(family.headUserId) === user._id,
    memberCount: family?.members.filter(m => !m.isDeceased).length ?? 0,
  };
}

/** Add / edit / remove members. Each call returns the updated card. */
export function useMemberMutations() {
  const qc = useQueryClient();
  const user = useAppSelector(selectUser);
  const setCard = (family: Family) => qc.setQueryData(familyKeys.card(user?._id), family);

  return {
    add: useMutation({
      mutationFn: async (member: MemberInput) => (await familyApi.addMember(member)).data.data,
      onSuccess: setCard,
    }),
    update: useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<MemberInput> }) =>
        (await familyApi.updateMember(id, data)).data.data,
      onSuccess: setCard,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => (await familyApi.removeMember(id)).data.data,
      onSuccess: setCard,
    }),
  };
}

export function useMyCertificates() {
  const user = useAppSelector(selectUser);
  return useQuery({
    queryKey: familyKeys.certificates(user?._id),
    enabled: !!user,
    queryFn: async () => (await familyApi.getCertificates()).data.data,
  });
}

export function useRequestCertificate() {
  const qc = useQueryClient();
  const user = useAppSelector(selectUser);
  return useMutation({
    mutationFn: async (payload: {
      memberId?: string;
      memberName: string;
      type: CertType;
      purpose: string;
      familyId?: string;
    }) => (await familyApi.requestCertificate(payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: familyKeys.certificates(user?._id) }),
  });
}

export function useMyTransfers() {
  const user = useAppSelector(selectUser);
  return useQuery({
    queryKey: familyKeys.transfers(user?._id),
    enabled: !!user,
    queryFn: async () => (await familyApi.getMyTransfers()).data.data,
  });
}

export function useRequestTransfer() {
  const qc = useQueryClient();
  const user = useAppSelector(selectUser);
  return useMutation({
    mutationFn: async (payload: { destinationChurchId: string; reason?: string }) =>
      (await familyApi.requestTransfer(payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: familyKeys.transfers(user?._id) }),
  });
}

export { fullName, initials } from '../utils/names';
