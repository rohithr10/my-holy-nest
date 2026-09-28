/** "2002-06-22" → "22/06/2002" for editing. */
export function toDisplayDate(iso?: string): string {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso ?? '';
}

/** "22/06/2002" → "2002-06-22"; null when it isn't a real, past date. */
export function toIsoDate(display: string): string | null {
  const m = display.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  const valid =
    date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  if (!valid || date.getTime() > Date.now() || y < 1900) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
