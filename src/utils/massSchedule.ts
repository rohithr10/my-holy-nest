import type { MassTiming } from '../types';

/**
 * Pure Mass-schedule helpers (no React, no network) so they can be unit
 * tested. Weekly timings repeat on dayOfWeek; one-off Masses carry a
 * specificDate instead.
 */

/** "18:30" → { clock: "6:30", meridiem: "PM" } */
export function formatMassTime(time: string): { clock: string; meridiem: 'AM' | 'PM' } {
  const [h, m] = time.split(':').map(Number);
  const meridiem = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { clock: `${h12}:${String(m).padStart(2, '0')}`, meridiem };
}

/** Timings on a weekday (0 = Sunday), excluding one-off dated Masses. */
export function timingsForDay(timings: MassTiming[] | undefined, day: number): MassTiming[] {
  return (timings ?? []).filter(m => !m.specificDate && m.dayOfWeek?.includes(day));
}

/** One-off dated Masses from today onwards, soonest first. */
export function upcomingSpecial(
  timings: MassTiming[] | undefined,
  now = new Date(),
): MassTiming[] {
  const today = localDate(now);
  return (timings ?? [])
    .filter(m => m.specificDate && m.specificDate.slice(0, 10) >= today)
    .sort((a, b) => (a.specificDate! + a.time).localeCompare(b.specificDate! + b.time));
}

/**
 * The next Mass after now: today's remaining timings, then the following days.
 * Returns the timing plus when it starts, or null if the schedule is empty.
 */
export function nextMass(timings: MassTiming[] | undefined, now = new Date()) {
  for (let offset = 0; offset < 8; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const candidates = timingsForDay(timings, date.getDay())
      .map(m => {
        const [h, min] = m.time.split(':').map(Number);
        const at = new Date(date);
        at.setHours(h, min, 0, 0);
        return { mass: m, at };
      })
      .filter(c => c.at > now)
      .sort((a, b) => a.at.getTime() - b.at.getTime());
    if (candidates.length) return candidates[0];
  }
  return null;
}

/** "In 45 min", "In 3 h", "Tomorrow", "Sat" */
export function startsIn(at: Date, now = new Date()): string {
  const mins = Math.round((at.getTime() - now.getTime()) / 60000);
  if (mins < 60) return `In ${Math.max(mins, 1)} min`;
  const sameDay = at.toDateString() === now.toDateString();
  if (sameDay) return `In ${Math.round(mins / 60)} h`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (at.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return at.toLocaleDateString('en-IN', { weekday: 'short' });
}

/** YYYY-MM-DD in the phone's own time zone (not UTC, which is 5½ h behind IST). */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
