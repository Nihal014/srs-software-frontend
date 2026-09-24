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

/** How every date is shown to the user (DatePipe default in app.config.ts, and displayDate() below). */
export const DISPLAY_DATE_FORMAT = 'dd/MM/yyyy';

/** Same format for dates that appear inside TypeScript strings (e.g. confirmation messages). */
export function displayDate(value: string | null | undefined): string {
  const date = parseDateString(value);
  if (!date) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}
