import {
  formatMassTime,
  timingsForDay,
  upcomingSpecial,
  nextMass,
  startsIn,
  localDate,
} from '../src/utils/massSchedule';
import type { MassTiming } from '../src/types';

const timing = (over: Partial<MassTiming>): MassTiming => ({
  _id: Math.random().toString(36).slice(2),
  churchId: 'c1',
  title: 'Mass',
  titleTA: '',
  time: '06:30',
  language: 'both',
  venue: 'Main Church',
  massType: 'regular',
  isActive: true,
  ...over,
});

describe('formatMassTime', () => {
  it.each([
    ['00:15', '12:15', 'AM'],
    ['06:30', '6:30', 'AM'],
    ['12:00', '12:00', 'PM'],
    ['18:05', '6:05', 'PM'],
  ])('%s → %s %s', (input, clock, meridiem) => {
    expect(formatMassTime(input)).toEqual({ clock, meridiem });
  });
});

describe('timingsForDay', () => {
  const sunday = timing({ title: 'Sunday', dayOfWeek: [0] });
  const weekdays = timing({ title: 'Weekdays', dayOfWeek: [1, 2, 3, 4, 5, 6] });
  const feast = timing({ title: 'Feast', dayOfWeek: [0], specificDate: '2026-12-25' });

  it('returns only weekly timings for that weekday', () => {
    expect(timingsForDay([sunday, weekdays, feast], 0).map(t => t.title)).toEqual(['Sunday']);
    expect(timingsForDay([sunday, weekdays], 3).map(t => t.title)).toEqual(['Weekdays']);
  });

  it('handles a missing schedule', () => {
    expect(timingsForDay(undefined, 0)).toEqual([]);
  });
});

describe('upcomingSpecial', () => {
  const now = new Date(2026, 8, 28, 1, 0); // 28 Sep 2026, 1:00 AM local
  it('keeps today and future dated Masses, soonest first', () => {
    const list = [
      timing({ title: 'Past', specificDate: '2026-09-27' }),
      timing({ title: 'Later', specificDate: '2026-10-02', time: '07:00' }),
      timing({ title: 'Today', specificDate: '2026-09-28', time: '18:00' }),
      timing({ title: 'Weekly', dayOfWeek: [0] }),
    ];
    expect(upcomingSpecial(list, now).map(t => t.title)).toEqual(['Today', 'Later']);
  });

  it('uses the local date, not UTC, just after midnight', () => {
    // 1 AM IST is still the previous day in UTC; today's Mass must count.
    expect(localDate(now)).toBe('2026-09-28');
  });
});

describe('nextMass', () => {
  const timings = [
    timing({ title: 'Morning', dayOfWeek: [1, 2, 3, 4, 5, 6], time: '06:30' }),
    timing({ title: 'Evening', dayOfWeek: [1, 2, 3, 4, 5, 6], time: '18:30' }),
    timing({ title: 'Sunday', dayOfWeek: [0], time: '07:30' }),
  ];

  it('picks the next one later today', () => {
    const monday9am = new Date(2026, 8, 28, 9, 0); // Monday
    expect(nextMass(timings, monday9am)?.mass.title).toBe('Evening');
  });

  it('rolls over to the next day when today is done', () => {
    const saturdayNight = new Date(2026, 9, 3, 20, 0); // Saturday 8 PM
    const next = nextMass(timings, saturdayNight);
    expect(next?.mass.title).toBe('Sunday');
    expect(next?.at.getDate()).toBe(4);
  });

  it('returns null for an empty schedule', () => {
    expect(nextMass([], new Date())).toBeNull();
  });
});

describe('startsIn', () => {
  const now = new Date(2026, 8, 28, 9, 0);
  it('describes the gap in plain words', () => {
    expect(startsIn(new Date(2026, 8, 28, 9, 45), now)).toBe('In 45 min');
    expect(startsIn(new Date(2026, 8, 28, 18, 30), now)).toBe('In 10 h');
    expect(startsIn(new Date(2026, 8, 29, 6, 30), now)).toBe('Tomorrow');
  });
});
