import type { CleanTask } from './types';
import { daysBetween, fromKey, weekday } from './date';

/** Is a cleaning task due on this date? (every-N and monthly tasks carry over until done) */
export function lastDoneBefore(done: Record<string, string[]>, id: string, date: string): string | undefined {
  let best: string | undefined;
  for (const [d, ids] of Object.entries(done)) if (d < date && ids.includes(id) && (!best || d > best)) best = d;
  return best;
}

/** lastDone = most recent completion before this date */
export function isDue(t: CleanTask, date: string): boolean {
  switch (t.freq) {
    case 'daily': return true;
    case 'weekly': return (t.days ?? []).includes(weekday(date));
    case 'every': return !t.lastDone || daysBetween(t.lastDone, date) >= (t.every ?? 7);
    case 'monthly': {
      const d = fromKey(date);
      const md = Math.min(t.monthDay ?? 1, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
      if (d.getDate() < md) return false;
      const dueKey = `${date.slice(0, 7)}-${String(md).padStart(2, '0')}`;
      return !t.lastDone || t.lastDone < dueKey;
    }
  }
}

export function freqLabel(t: CleanTask): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  switch (t.freq) {
    case 'daily': return 'Every day';
    case 'weekly': return (t.days ?? []).length ? `Weekly · ${[...(t.days ?? [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => names[d]).join(', ')}` : 'Weekly';
    case 'every': return `Every ${t.every ?? 7} days`;
    case 'monthly': return `Monthly · day ${t.monthDay ?? 1}`;
  }
}
