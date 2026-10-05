export const N = (v: unknown): number => Number(v) || 0;

export function inr(v: unknown): string {
  const n = N(v);
  return (n < 0 ? '−₹' : '₹') + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/** Local-date ISO string (yyyy-MM-dd) — avoids the UTC shift of toISOString(). */
export function isoOf(d: Date): string {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}

export const todayIso = (): string => isoOf(new Date());

export const inRange = (date: string, from: string, to: string): boolean =>
  (!from || date >= from) && (!to || date <= to);

export const fmtDate = (iso: string): string =>
  new Date(iso + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export const fullDate = (iso: string): string =>
  new Date(iso + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const monthName = (key: string): string =>
  new Date(key.slice(0, 7) + '-01T00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

export const pct = (part: number, whole: number): string =>
  whole ? ((part / whole) * 100).toFixed(1) + '%' : '—';

export const sumBy = <T>(arr: readonly T[], f: (x: T) => number): number =>
  arr.reduce((a, x) => a + f(x), 0);

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
