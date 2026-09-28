import { useQuery } from '@tanstack/react-query';
import { churchApi } from '../api/church.api';
import { useAppSelector } from './useAppDispatch';
import { selectChurch } from '../store/slices/auth.slice';

/** All active Mass timings for the current parish (the API sorts by time). */
export function useMassTimings() {
  const church = useAppSelector(selectChurch);
  return useQuery({
    queryKey: ['mass-timings', church?._id],
    enabled: !!church?._id,
    queryFn: async () => (await churchApi.getMassTimings()).data.data,
  });
}

/** The parish's live stream, or the next scheduled one; null when there is none. */
export function useLiveStream() {
  const church = useAppSelector(selectChurch);
  return useQuery({
    queryKey: ['mass-live', church?._id],
    enabled: !!church?._id,
    queryFn: async () => (await churchApi.getLiveStream()).data.data,
    // A stream going live should show up without reopening the app.
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}

export function useRecordedMasses() {
  const church = useAppSelector(selectChurch);
  return useQuery({
    queryKey: ['mass-recorded', church?._id],
    enabled: !!church?._id,
    queryFn: async () => (await churchApi.getRecordedMasses()).data.data,
  });
}

export { formatMassTime, timingsForDay, upcomingSpecial, nextMass, startsIn } from '../utils/massSchedule';
