import { describe, expect, it } from 'vitest';
import { SEED_FOODS, SEED_RECIPES } from '../src/lib/seed';
import { itemMacros, recipeMacros, gramsOf } from '../src/lib/nutrition';
import { buildGroceries } from '../src/lib/grocery';
import { addDays, weekStart, weekday } from '../src/lib/date';
import { changeOver, progress, rollingAverage } from '../src/lib/weight';
import { startSession, tick, pause, resume, strengthWorkout, bikeIntervals, isDone, skip } from '../src/lib/workouts';
import type { DayPlan } from '../src/lib/types';

const foods = Object.fromEntries(SEED_FOODS.map((f) => [f.id, f]));
const recipes = Object.fromEntries(SEED_RECIPES.map((r) => [r.id, r]));

describe('nutrition', () => {
  it('seed recipes land near the stated estimates', () => {
    const expect_: Record<string, [number, number]> = {
      'b-eggs': [400, 29], 'b-oats': [370, 28], 'l-chicken': [440, 42], 'l-turkey': [455, 40],
      'd-salmon': [510, 39], 'd-shrimp': [485, 43], 'd-beef': [545, 44], 's-yogurt': [100, 16],
      'x-strawberries': [180, 2], 'x-pudding': [175, 19], 'x-froyo': [150, 4], 'x-cookies': [150, 1.5]
    };
    for (const [id, [cal, p]] of Object.entries(expect_)) {
      const m = recipeMacros(foods, recipes[id]);
      expect(Math.abs(m.cal - cal) / cal, `${id} cal ${m.cal}`).toBeLessThan(0.15);
      expect(Math.abs(m.protein - p), `${id} protein ${m.protein}`).toBeLessThan(10);
    }
  });
  it('portions scale nutrition linearly', () => {
    const a = itemMacros({ id: 'x', recipeId: 'l-chicken', servings: 1 }, recipes, foods);
    const b = itemMacros({ id: 'x', recipeId: 'l-chicken', servings: 1.5 }, recipes, foods);
    expect(b.cal).toBeCloseTo(a.cal * 1.5, 5);
  });
  it('unit conversion', () => {
    expect(gramsOf(foods['chicken-cooked'], 4, 'oz')).toBeCloseTo(113.4, 1);
    expect(gramsOf(foods['olive-oil'], 1, 'tsp')).toBeCloseTo(4.5, 1);
    expect(gramsOf(foods['greek-yogurt'], 1, 'tbsp')).toBe(15);
  });
});

describe('dates', () => {
  it('weeks start Monday', () => {
    expect(weekStart('2026-10-20')).toBe('2026-10-19');
    expect(weekStart('2026-10-25')).toBe('2026-10-19');
    expect(weekday('2026-10-25')).toBe(0);
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02'); // across DST
  });
});

describe('groceries', () => {
  it('combines duplicate ingredients and converts cooked → raw', () => {
    const day = (l: string): DayPlan => ({ breakfast: [], lunch: [{ id: l, recipeId: l, servings: 1 }], dinner: [], snack: [], dessert: [] });
    const list = buildGroceries([day('l-chicken'), day('l-chicken'), day('l-chicken'), day('l-turkey')], recipes, foods, []);
    const chicken = list.find((i) => i.key === 'chicken-raw')!;
    expect(chicken.qty).toBe(1); // 12 oz cooked ≈ 1 lb raw
    const rice = list.filter((i) => i.key === 'rice');
    expect(rice.length).toBe(1);
    const owned = buildGroceries([day('l-chicken')], recipes, foods, ['rice']);
    expect(owned.find((i) => i.key === 'rice')).toBeUndefined();
  });
});

describe('weight', () => {
  it('progress & changes', () => {
    expect(progress(178, 150, 171).lost).toBe(7);
    expect(progress(178, 150, 171).pct).toBe(25);
    const w = [{ id: '1', date: '2026-10-01', lbs: 178 }, { id: '2', date: '2026-10-13', lbs: 176 }, { id: '3', date: '2026-10-20', lbs: 175 }];
    expect(changeOver(w, 7, '2026-10-20')).toBe(-1);
    expect(changeOver(w, 90, '2026-10-20')).toBe(null);
    expect(rollingAverage(w)[2].avg).toBe(175);
    expect(rollingAverage([...w, { id: '4', date: '2026-10-18', lbs: 176 }])[3].avg).toBe(175.5);
  });
});

describe('timer engine', () => {
  it('catches up after backgrounding using timestamps', () => {
    const def = bikeIntervals();
    let s = startSession(def, '2026-10-20', 0);
    // phone locked for 6 minutes: 4 min warmup + 1 min push + 1 min into recovery
    s = tick(s, 6 * 60 * 1000).s;
    expect(s.index).toBe(2);
    s = pause(s, 6 * 60 * 1000);
    s = resume(s, 10 * 60 * 1000); // 4 min pause doesn't count
    s = tick(s, 11 * 60 * 1000 + 1).s;
    expect(s.index).toBe(3);
    s = tick(s, 60 * 60 * 1000).s;
    expect(isDone(s)).toBe(true);
  });
  it('strength cooldown fills the remaining time', () => {
    const def = strengthWorkout(20);
    expect(def.phases.filter((p) => p.kind === 'reps').length).toBe(8);
    let s = startSession(def, '2026-10-20', 0);
    // skip through every phase in 10 minutes total
    const fillIdx = s.phases.findIndex((p) => p.fill);
    for (let i = 0; i < fillIdx; i++) s = skip(s, ((i + 1) / fillIdx) * 10 * 60 * 1000);
    expect(s.index).toBe(fillIdx);
    expect(s.phases[fillIdx].seconds).toBe(600);
    expect(s.phases.some((p) => p.fill)).toBe(true);
  });
});

import { avgCycle, cycleStatus, isPeriodDay } from '../src/lib/cycle';
import { readyToLevelUp } from '../src/lib/workouts';

describe('cycle', () => {
  const periods = [
    { id: 'a', start: '2026-08-01', end: '2026-08-05' },
    { id: 'b', start: '2026-08-30', end: '2026-09-03' },
    { id: 'c', start: '2026-09-28', end: '2026-10-02' }
  ];
  it('averages cycle length and predicts the next period', () => {
    expect(avgCycle(periods).length).toBe(29);
    const st = cycleStatus(periods, '2026-10-20')!;
    expect(st.day).toBe(23);
    expect(st.nextStart).toBe('2026-10-27');
    expect(st.until).toBe(7);
    expect(st.phase).toBe('Luteal');
    expect(isPeriodDay(periods, '2026-09-29', '2026-10-20')).toBe(true);
    expect(isPeriodDay(periods, '2026-10-10', '2026-10-20')).toBe(false);
  });
  it('defaults to 28 days with one period', () => {
    const st = cycleStatus([{ id: 'x', start: '2026-10-18' }], '2026-10-20')!;
    expect(st.onPeriod).toBe(true);
    expect(st.phase).toBe('Period');
    expect(avgCycle([{ id: 'x', start: '2026-10-18' }]).fromData).toBe(false);
  });
});

describe('strength progression', () => {
  const w = (at: number, reps: number[], difficulty?: number) => ({ id: String(at), date: '2026-10-01', type: 'strength' as const, name: '', plannedMin: 20, actualMin: 20, completed: true, difficulty, reps: { squat: reps }, levels: { squat: 0 }, at });
  it('suggests level up after two easy, complete sessions', () => {
    expect(readyToLevelUp([w(1, [12, 12], 3), w(2, [12, 13], 2)], 'squat', 0, 12)).toBe(true);
    expect(readyToLevelUp([w(1, [12, 12], 3), w(2, [12, 10], 2)], 'squat', 0, 12)).toBe(false);
    expect(readyToLevelUp([w(1, [12, 12], 4), w(2, [12, 12], 2)], 'squat', 0, 12)).toBe(false);
    expect(readyToLevelUp([w(2, [12, 12])], 'squat', 0, 12)).toBe(false);
  });
});

import { conflicts, dietBadges } from '../src/lib/diet';
import { isDue } from '../src/lib/clean';
import { suggestTargets } from '../src/lib/targets';

describe('diet filtering', () => {
  it('flags conflicts by diet', () => {
    expect(conflicts(recipes['l-chicken'], foods, ['vegetarian']).length).toBe(1);
    expect(conflicts(recipes['d-shrimp'], foods, ['pescatarian'])).toEqual([]);
    expect(conflicts(recipes['d-shrimp'], foods, ['shellfish-free']).length).toBe(1);
    expect(conflicts(recipes['d-tofu'], foods, ['vegan'])).toEqual([]);
    expect(conflicts(recipes['d-tofu'], foods, ['gluten-free']).length).toBe(1);
    expect(dietBadges(recipes['l-lentil'], foods)).toContain('Vegan');
    // every diet has at least one recipe for every meal
    for (const d of ['vegetarian', 'pescatarian', 'vegan', 'gluten-free', 'dairy-free'] as const)
      for (const slot of ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'])
        expect(SEED_RECIPES.some((r) => r.slot === slot && conflicts(r, foods, [d]).length === 0), `${d} ${slot}`).toBe(true);
  });
});

describe('cleaning schedule', () => {
  it('handles weekly, every-N and monthly tasks', () => {
    expect(isDue({ id: 'a', name: '', room: '', freq: 'weekly', days: [2], minutes: 5 }, '2026-10-20')).toBe(true); // Tuesday
    expect(isDue({ id: 'a', name: '', room: '', freq: 'weekly', days: [3], minutes: 5 }, '2026-10-20')).toBe(false);
    expect(isDue({ id: 'b', name: '', room: '', freq: 'every', every: 7, minutes: 5, lastDone: '2026-10-15' }, '2026-10-20')).toBe(false);
    expect(isDue({ id: 'b', name: '', room: '', freq: 'every', every: 7, minutes: 5, lastDone: '2026-10-10' }, '2026-10-20')).toBe(true);
    expect(isDue({ id: 'c', name: '', room: '', freq: 'monthly', monthDay: 15, minutes: 5, lastDone: '2026-09-15' }, '2026-10-20')).toBe(true);
    expect(isDue({ id: 'c', name: '', room: '', freq: 'monthly', monthDay: 15, minutes: 5, lastDone: '2026-10-16' }, '2026-10-20')).toBe(false);
  });
});

describe('targets', () => {
  it('suggests a reasonable starting target', () => {
    const t = suggestTargets({ sex: 'female', age: 33, heightIn: 67, weightLb: 178, goalLb: 150, activity: 'sedentary' });
    expect(t.cal).toBeGreaterThanOrEqual(1500);
    expect(t.cal).toBeLessThanOrEqual(1750);
    expect(t.proteinMin).toBe(115);
    const low = suggestTargets({ sex: 'female', age: 60, heightIn: 58, weightLb: 110, goalLb: 100, activity: 'sedentary' });
    expect(low.cal).toBeGreaterThanOrEqual(1300);
  });
});

import { migrate, initialState } from '../src/lib/store';
describe('migration', () => {
  it('converts water glasses to ounces and drops Home from the bottom bar', () => {
    const st: any = initialState();
    st.settings = { ...st.settings, waterOz: undefined, waterTarget: 8, navTabs: ['home', 'meals', 'workouts', 'progress', 'social'] };
    st.water = { '2026-10-20': 5 };
    const m = migrate(st);
    expect(m.water['2026-10-20']).toBe(40);
    expect(m.settings.waterTarget).toBe(64);
    expect(m.settings.navTabs).toEqual(['meals', 'workouts', 'progress', 'social', 'groceries']);
    expect(migrate(m).water['2026-10-20']).toBe(40); // idempotent
  });
});
