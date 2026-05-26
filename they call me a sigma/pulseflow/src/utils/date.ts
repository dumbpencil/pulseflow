export function toISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => daysAgoISO(6 - i));
}

export function formatRelativeDate(isoDate: string): string {
  const today = todayISO();
  const yesterday = daysAgoISO(1);
  if (isoDate === today) return 'Today';
  if (isoDate === yesterday) return 'Yesterday';
  return formatDisplayDate(isoDate);
}
