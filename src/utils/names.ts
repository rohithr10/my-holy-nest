/** "Mary", "Mary Raj" — never "Mary undefined". */
export function fullName(p?: { firstName?: string; lastName?: string } | null): string {
  return [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
}

/** Up to two initials from whatever name parts exist. */
export function initials(p?: { firstName?: string; lastName?: string } | null): string {
  const parts = [p?.firstName, p?.lastName].filter(Boolean) as string[];
  return parts.map(s => s.trim()[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?';
}
