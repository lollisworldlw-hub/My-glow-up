import type { WeightEntry } from './types';
import { addDays, daysBetween, weekStart } from './date';

export const sortWeights = (w: WeightEntry[]) => [...w].sort((a, b) => a.date.localeCompare(b.date) || 0);

export function latest(w: WeightEntry[]) {
  const s = sortWeights(w);
  return s[s.length - 1];
}

/** latest entry on or before a date */
export function onOrBefore(w: WeightEntry[], date: string) {
  const s = sortWeights(w).filter((e) => e.date <= date);
  return s[s.length - 1];
}

export function changeOver(w: WeightEntry[], days: number, today: string): number | null {
  const cur = latest(w);
  if (!cur) return null;
  const past = onOrBefore(w, addDays(cur.date > today ? today : cur.date, -days));
  if (!past) return null;
  return +(cur.lbs - past.lbs).toFixed(1);
}

export function weekAverage(w: WeightEntry[], anyDayInWeek: string): number | null {
  const ws = weekStart(anyDayInWeek);
  const we = addDays(ws, 6);
  const list = w.filter((e) => e.date >= ws && e.date <= we);
  if (!list.length) return null;
  return +(list.reduce((s, e) => s + e.lbs, 0) / list.length).toFixed(1);
}

/** trailing 7-day average for each weigh-in (smooths daily water swings) */
export function rollingAverage(w: WeightEntry[]) {
  const s = sortWeights(w);
  return s.map((e) => {
    const win = s.filter((x) => x.date <= e.date && daysBetween(x.date, e.date) < 7);
    return { date: e.date, avg: +(win.reduce((a, x) => a + x.lbs, 0) / win.length).toFixed(1) };
  });
}

export function progress(start: number, goal: number, current: number) {
  const total = start - goal;
  const lost = +(start - current).toFixed(1);
  const remaining = +Math.max(0, current - goal).toFixed(1);
  const pct = total > 0 ? Math.min(100, Math.max(0, (lost / total) * 100)) : 0;
  return { lost, remaining, pct };
}

export const kgToLb = (kg: number) => kg / 0.45359237;
export const lbToKg = (lb: number) => lb * 0.45359237;
