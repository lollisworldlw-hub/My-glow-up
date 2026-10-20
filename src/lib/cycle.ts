import type { Period } from './types';
import { addDays, daysBetween } from './date';

export const SYMPTOMS = ['Cramps', 'Bloating', 'Cravings', 'Headache', 'Low energy', 'Mood swings', 'Tender breasts', 'Acne', 'Back pain', 'Trouble sleeping'];

export const sortPeriods = (p: Period[]) => [...p].sort((a, b) => a.start.localeCompare(b.start));

/** average start-to-start length from recent cycles (ignores implausible gaps) */
export function avgCycle(periods: Period[]): { length: number; fromData: boolean } {
  const s = sortPeriods(periods);
  const gaps: number[] = [];
  for (let i = 1; i < s.length; i++) {
    const g = daysBetween(s[i - 1].start, s[i].start);
    if (g >= 18 && g <= 45) gaps.push(g);
  }
  const recent = gaps.slice(-6);
  if (!recent.length) return { length: 28, fromData: false };
  return { length: Math.round(recent.reduce((a, b) => a + b, 0) / recent.length), fromData: true };
}

export function avgPeriodLength(periods: Period[]): number {
  const done = periods.filter((p) => p.end).map((p) => daysBetween(p.start, p.end!) + 1).filter((n) => n >= 1 && n <= 10);
  if (!done.length) return 5;
  return Math.round(done.reduce((a, b) => a + b, 0) / done.length);
}

export function currentPeriod(periods: Period[], today: string) {
  const s = sortPeriods(periods);
  const last = s[s.length - 1];
  if (!last || last.start > today) return null;
  if (!last.end && daysBetween(last.start, today) <= 10) return last;
  if (last.end && today <= last.end) return last;
  return null;
}

export function isPeriodDay(periods: Period[], date: string, today: string) {
  return periods.some((p) => {
    const end = p.end ?? (daysBetween(p.start, today) <= 10 ? today : addDays(p.start, 4));
    return date >= p.start && date <= end;
  });
}

export type Phase = 'Period' | 'Follicular' | 'Ovulation window' | 'Luteal' | 'Period may start soon';

export function cycleStatus(periods: Period[], today: string) {
  const s = sortPeriods(periods).filter((p) => p.start <= today);
  const last = s[s.length - 1];
  if (!last) return null;
  const { length, fromData } = avgCycle(periods);
  const plen = avgPeriodLength(periods);
  const day = daysBetween(last.start, today) + 1;
  let next = addDays(last.start, length);
  while (next < today && daysBetween(last.start, today) > length + 10) next = addDays(next, length); // long gap: keep predicting forward
  const until = daysBetween(today, next);
  const onPeriod = !!currentPeriod(periods, today);
  const ov = length - 14;
  const phase: Phase = onPeriod ? 'Period'
    : until <= 3 ? 'Period may start soon'
    : day >= ov - 2 && day <= ov + 1 ? 'Ovulation window'
    : day < ov - 2 ? 'Follicular' : 'Luteal';
  return { day, length, fromData, periodLength: plen, nextStart: next, until, phase, onPeriod };
}

/** Is this date within the few days around a period, when water retention is common? */
export function nearPeriod(periods: Period[], date: string, today: string) {
  const st = cycleStatus(periods, today);
  if (!st) return false;
  if (st.onPeriod || (st.until >= 0 && st.until <= 5)) return true;
  return periods.some((p) => date >= addDays(p.start, -5) && date <= addDays(p.start, 2));
}

export const PHASE_NOTE: Record<Phase, string> = {
  Period: 'Rest when you need it. Gentle walks can ease cramps, and the scale often reads higher from water.',
  Follicular: 'Energy often rises now — a nice time to push a little in workouts.',
  'Ovulation window': 'Many people feel their strongest around now.',
  Luteal: 'Cravings and hunger can rise — your planned dessert and an extra protein snack are there for you.',
  'Period may start soon': 'Water weight and cravings are common before a period. The trend will settle.'
};
