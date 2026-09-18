export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function fmtDate(d: string | Date): string {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function fmtDateTime(d: string | Date): string {
  const dt = new Date(d);
  return `${fmtDate(dt)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function addDays(date: string | Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function todayStr(): string {
  return fmtDate(new Date());
}

export function daysUntil(dateStr: string, today: string = todayStr()): number {
  const ms = new Date(dateStr).setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

// Minimum value for a <input type="date"> expiry field: tomorrow, since the
// DB requires expiry_date to be strictly in the future at creation time.
export function minFutureDateStr(): string {
  return fmtDate(addDays(new Date(), 1));
}
