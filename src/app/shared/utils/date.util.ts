/** Local-time 'YYYY-MM-DD' — never use toISOString() for this, it shifts the day in timezones ahead of UTC (e.g. IST). */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses 'YYYY-MM-DD' (or an ISO datetime, using its local date) into a local Date; null when empty/invalid. */
export function parseDateString(value: string | null | undefined): Date | null {
  if (!value) return null;
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = plain ? new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3])) : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}
