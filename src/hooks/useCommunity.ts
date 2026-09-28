import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '../api/community.api';
import { useAppSelector } from './useAppDispatch';
import { selectChurch, selectUser } from '../store/slices/auth.slice';
import type { ClubType, Event, JobPosting } from '../types';

export const GROUP_META: Record<ClubType, { icon: string; nameTA: string; color: string }> = {
  youth: { icon: 'soccer', nameTA: 'இளைஞர் குழு', color: '#4A90D9' },
  women: { icon: 'human-female', nameTA: 'மாதர் சங்கம்', color: '#EF4444' },
  widows: { icon: 'account-heart-outline', nameTA: 'விதவையர் உதவி', color: '#C9A84C' },
  children: { icon: 'book-multiple-outline', nameTA: 'குழந்தைகள் உதவி', color: '#10B981' },
  volunteers: { icon: 'hand-heart-outline', nameTA: 'தன்னார்வலர்கள்', color: '#1A3A5C' },
};

export function useGroups() {
  const church = useAppSelector(selectChurch);
  return useQuery({
    queryKey: ['groups', church?._id],
    enabled: !!church?._id,
    queryFn: async () => (await communityApi.getGroups()).data.data,
  });
}

/** Upcoming events for the parish, or for one group when groupId is given. */
export function useEvents(groupId?: string) {
  const church = useAppSelector(selectChurch);
  const user = useAppSelector(selectUser);
  return useQuery({
    queryKey: ['events', church?._id, user?._id, groupId ?? 'all'],
    enabled: !!church?._id,
    queryFn: async () =>
      (await communityApi.getEvents({ status: 'upcoming', ...(groupId ? { groupId } : {}) })).data.data,
  });
}

/** Toggles the user's RSVP and patches every cached event list in place. */
export function useRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => ({
      eventId,
      ...(await communityApi.rsvpEvent(eventId)).data.data,
    }),
    onSuccess: ({ eventId, hasRsvped, rsvpCount }) => {
      qc.setQueriesData<Event[]>({ queryKey: ['events'] }, list =>
        list?.map(e => (e._id === eventId ? { ...e, hasRsvped, rsvpCount } : e)),
      );
    },
  });
}

export function useJobs(category?: JobPosting['category']) {
  const church = useAppSelector(selectChurch);
  return useQuery({
    queryKey: ['jobs', church?._id, category ?? 'all'],
    enabled: !!church?._id,
    queryFn: async () => (await communityApi.getJobs(category)).data.data,
  });
}

export function useGallery(params?: { type?: 'photo' | 'video'; year?: number }) {
  const church = useAppSelector(selectChurch);
  return useQuery({
    queryKey: ['gallery', church?._id, params?.type ?? 'all', params?.year ?? 'all'],
    enabled: !!church?._id,
    queryFn: async () => (await communityApi.getGallery(params)).data.data,
  });
}

export function eventDate(e: Event): string {
  const start = new Date(e.startDate);
  const day = start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}
