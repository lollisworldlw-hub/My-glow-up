import { useEffect, useState } from 'react';
import type { State } from './store';
import type { Habit, Macros } from './types';
import { SLOTS } from './types';
import { add, itemMacros, ZERO } from './nutrition';
import { todayKey, weekday } from './date';

export function useToday() {
  const [t, setT] = useState(todayKey());
  useEffect(() => {
    const up = () => setT(todayKey());
    const iv = setInterval(up, 30000);
    document.addEventListener('visibilitychange', up);
    window.addEventListener('focus', up);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', up); window.removeEventListener('focus', up); };
  }, []);
  return t;
}

export function consumed(s: State, date: string): Macros {
  return s.logs.filter((l) => l.date === date).reduce((a, l) => add(a, l), ZERO);
}

export function planned(s: State, date: string): Macros {
  const day = s.plans[date];
  if (!day) return ZERO;
  let t = ZERO;
  for (const slot of SLOTS) for (const it of day[slot] ?? []) t = add(t, itemMacros(it, s.recipes, s.foods));
  return t;
}

export const isLogged = (s: State, itemId: string) => s.logs.find((l) => l.planItemId === itemId);

export function habitApplies(s: State, h: Habit, date: string) {
  const sch = s.schedule[weekday(date)];
  if (h.rule === 'walk-days') return sch?.walk === 'walk';
  if (h.rule === 'workout-days') return sch?.home !== 'rest' && !sch?.homeOptional;
  return true;
}

export function habitAuto(s: State, h: Habit, date: string): boolean {
  switch (h.auto) {
    case 'walk': return s.workouts.some((w) => w.date === date && w.type === 'walk' && w.completed);
    case 'workout': return s.workouts.some((w) => w.date === date && w.type !== 'walk' && w.completed);
    case 'protein': return consumed(s, date).protein >= s.settings.proteinMin;
    case 'water': return (s.water[date] ?? 0) >= s.settings.waterTarget;
    case 'dessert': return s.logs.some((l) => l.date === date && l.slot === 'dessert' && !l.prelogged);
    default: return false;
  }
}

export const habitDone = (s: State, h: Habit, date: string) => !!s.habitChecks[date]?.[h.id] || habitAuto(s, h, date);

export function dayHabitStats(s: State, date: string, homeOnly = false) {
  const hs = s.habits.filter((h) => (!homeOnly || h.home) && habitApplies(s, h, date));
  const required = hs.filter((h) => !h.optional);
  const done = required.filter((h) => habitDone(s, h, date)).length;
  const bonus = hs.filter((h) => h.optional && habitDone(s, h, date)).length;
  return { done, total: required.length, bonus, habits: hs };
}
