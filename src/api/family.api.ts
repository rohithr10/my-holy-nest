import apiClient from './client';
import type {
  ApiResponse,
  Family,
  FamilyMember,
  CertificateRequest,
  CertType,
  TransferRequest,
} from '../types';

/**
 * Fields a family head can set on a member. The head is created with the card
 * at registration and can't be added or relabelled, so 'head' isn't allowed.
 */
export interface MemberInput {
  firstName: string;
  lastName?: string;
  dob?: string; // YYYY-MM-DD
  gender?: 'M' | 'F';
  relation: Exclude<FamilyMember['relation'], 'head'>;
  occupation?: string;
}

export const familyApi = {
  getMyCard: () => apiClient.get<ApiResponse<Family>>('/families/me'),

  addMember: (member: MemberInput) =>
    apiClient.post<ApiResponse<Family>>('/families/me/members', member),

  updateMember: (memberId: string, data: Partial<MemberInput>) =>
    apiClient.patch<ApiResponse<Family>>(`/families/me/members/${memberId}`, data),

  removeMember: (memberId: string) =>
    apiClient.delete<ApiResponse<Family>>(`/families/me/members/${memberId}`),

  // Certificates
  getCertificates: () =>
    apiClient.get<ApiResponse<CertificateRequest[]>>('/certificates/me', {
      params: { limit: 100 },
    }),

  requestCertificate: (payload: {
    memberId?: string;
    memberName: string;
    type: CertType;
    purpose: string;
    familyId?: string;
  }) => apiClient.post<ApiResponse<CertificateRequest>>('/certificates', payload),

  // Church transfer
  requestTransfer: (payload: { destinationChurchId: string; reason?: string }) =>
    apiClient.post<ApiResponse<TransferRequest>>('/transfers', payload),

  getMyTransfers: () => apiClient.get<ApiResponse<TransferRequest[]>>('/transfers/me'),
};
