import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type {
  Checkin, CleanTask, CycleDay, DayPlan, Food, FoodPhoto, MindGoal, MoodEntry, Period, GroceryItem, Habit, LogEntry, MeasureEntry, PhotoMeta, PlanItem, PrepTask, Recipe,
  ScheduleDay, Settings, Slot, WeightEntry, WorkoutLog, Macros
} from './types';
import { SLOTS } from './types';
import {
  SEED_FOODS, SEED_RECIPES, SEED_SCHEDULE, SEED_ROTATION, SEED_HABITS, SEED_GROCERIES,
  PREP_SUNDAY, PREP_WEDNESDAY, defaultSettings, SEED_MIND_GOALS, SEED_MOOD_TAGS, SEED_CLEAN, SEED_ROOMS
} from './seed';
import { fitsDiet } from './diet';
import { addDays, todayKey, uid, weekDays, weekday } from './date';
import { itemMacros, itemName, round } from './nutrition';
import { buildGroceries, mergeGroceries } from './grocery';
import type { Session } from './workouts';

export interface State {
  settings: Settings;
  foods: Record<string, Food>;
  recipes: Record<string, Recipe>;
  favorites: string[];
  plans: Record<string, DayPlan>;
  logs: LogEntry[];
  weights: WeightEntry[];
  measures: MeasureEntry[];
  photos: PhotoMeta[];
  habits: Habit[];
  habitChecks: Record<string, Record<string, boolean>>;
  water: Record<string, number>;
  notes: Record<string, string>;
  workouts: WorkoutLog[];
  schedule: Record<number, ScheduleDay>;
  rotation: Record<number, Record<string, string>>;
  groceries: GroceryItem[];
  owned: string[];
  prepTasks: { sunday: PrepTask[]; wednesday: PrepTask[] };
  prepChecks: Record<string, string[]>;
  session: Session | null;
  lastBackup: number | null;
  reminderSeen: Record<string, string[]>;
  checkins: Checkin[];
  exerciseLevels: Record<string, number>;
  steps: Record<string, number>;
  periods: Period[];
  cycleDays: Record<string, CycleDay>;
  snoozes: Record<string, string>;
  moods: Record<string, MoodEntry>;
  moodTags: string[];
  mindGoals: MindGoal[];
  mindChecks: Record<string, string[]>;
  cleanTasks: CleanTask[];
  rooms: string[];
  cleanDone: Record<string, string[]>;
  shared: string[];
  foodPhotos: FoodPhoto[];
}

const byId = <T extends { id: string }>(a: T[]) => Object.fromEntries(a.map((x) => [x.id, x])) as Record<string, T>;

export const initialState = (): State => ({
  settings: defaultSettings(todayKey()),
  foods: byId(SEED_FOODS),
  recipes: byId(SEED_RECIPES),
  favorites: [],
  plans: {},
  logs: [],
  weights: [],
  measures: [],
  photos: [],
  habits: SEED_HABITS,
  habitChecks: {},
  water: {},
  notes: {},
  workouts: [],
  schedule: SEED_SCHEDULE,
  rotation: SEED_ROTATION,
  groceries: [],
  owned: [],
  prepTasks: { sunday: PREP_SUNDAY, wednesday: PREP_WEDNESDAY },
  prepChecks: {},
  session: null,
  lastBackup: null,
  reminderSeen: {},
  checkins: [],
  exerciseLevels: {},
  steps: {},
  periods: [],
  cycleDays: {},
  snoozes: {},
  moods: {},
  moodTags: SEED_MOOD_TAGS,
  mindGoals: SEED_MIND_GOALS,
  mindChecks: {},
  cleanTasks: SEED_CLEAN,
  rooms: SEED_ROOMS,
  cleanDone: {},
  shared: [],
  foodPhotos: []
});

export const emptyDay = (): DayPlan => ({ breakfast: [], lunch: [], dinner: [], snack: [], dessert: [] });
const item = (recipeId: string): PlanItem => ({ id: uid(), recipeId, servings: 1 });

function disliked(s: State, recipeId: string) {
  const r = s.recipes[recipeId];
  if (!r || !s.settings.dislikes.length) return false;
  const words = s.settings.dislikes.map((d) => d.toLowerCase().trim()).filter(Boolean);
  const text = [r.name, ...r.ingredients.map((i) => s.foods[i.foodId]?.name ?? '')].join(' ').toLowerCase();
  return words.some((w) => text.includes(w));
}

function pickFor(s: State, slot: Slot, preferred: string | undefined, n: number, useFavorites: boolean) {
  const ok = (id: string) => s.recipes[id] && s.recipes[id].slot === slot && !disliked(s, id) && fitsDiet(s.recipes[id], s.foods, s.settings.diets ?? []);
  if (!useFavorites && preferred && ok(preferred)) return preferred;
  const pool = Object.values(s.recipes).filter((r) => ok(r.id)).map((r) => r.id);
  const fav = s.favorites.filter((id) => pool.includes(id));
  const list = useFavorites && fav.length ? fav : pool;
  return list.length ? list[n % list.length] : undefined;
}

function generateDay(s: State, date: string, useFavorites: boolean, n: number): DayPlan {
  const rot = s.rotation[weekday(date)] ?? {};
  const d = emptyDay();
  for (const slot of SLOTS) {
    const id = pickFor(s, slot, rot[slot], n, useFavorites);
    if (id) d[slot].push(item(id));
  }
  return d;
}

type Actions = {
  set: (fn: (s: State) => void) => void;
  ensureWeek: (monday: string) => void;
  generateWeek: (monday: string, mode: 'rotation' | 'favorites' | 'copy-prev' | 'clear') => void;
  logItem: (date: string, slot: Slot, itemId: string, servings?: number, prelogged?: boolean) => void;
  unlogItem: (itemId: string) => void;
  syncLog: (itemId: string) => void;
  addLog: (e: Omit<LogEntry, 'id' | 'at'>) => void;
  generateGroceries: (dates: string[]) => void;
  replaceAll: (s: State) => void;
};

export type Store = State & Actions;

const idbStorage = {
  getItem: async (k: string) => (await idbGet(k)) ?? null,
  setItem: async (k: string, v: string) => { await idbSet(k, v); },
  removeItem: async (k: string) => { await idbDel(k); }
};

export function findItem(s: State, itemId: string): { date: string; slot: Slot; item: PlanItem } | null {
  for (const [date, day] of Object.entries(s.plans)) {
    for (const slot of SLOTS) {
      const it = day[slot]?.find((x) => x.id === itemId);
      if (it) return { date, slot, item: it };
    }
  }
  return null;
}

export const useStore = create<Store>()(
  persist(
    immer((set, get) => ({
      ...initialState(),
      set: (fn) => set((s) => { fn(s as State); }),
      ensureWeek: (monday) => {
        const s = get();
        if (!s.settings.autoFillWeeks) return;
        const days = weekDays(monday);
        if (days.some((d) => s.plans[d])) return; // already planned (even partially)
        set((st) => {
          days.forEach((d, i) => { st.plans[d] = generateDay(st as State, d, false, i); });
        });
      },
      generateWeek: (monday, mode) => set((st) => {
        const days = weekDays(monday);
        days.forEach((d, i) => {
          if (mode === 'clear') st.plans[d] = emptyDay();
          else if (mode === 'copy-prev') {
            const src = st.plans[addDays(d, -7)];
            st.plans[d] = src
              ? (Object.fromEntries(SLOTS.map((sl) => [sl, (src[sl] ?? []).map((x) => ({ ...JSON.parse(JSON.stringify(x)), id: uid() }))])) as DayPlan)
              : generateDay(st as State, d, false, i);
          } else st.plans[d] = generateDay(st as State, d, mode === 'favorites', i + (mode === 'favorites' ? Math.floor(Math.random() * 7) : 0));
        });
      }),
      logItem: (date, slot, itemId, servings, prelogged) => set((st) => {
        const day = st.plans[date];
        const it = day?.[slot]?.find((x) => x.id === itemId);
        if (!it) return;
        if (servings != null) it.servings = servings;
        const mac = round(itemMacros(it as PlanItem, st.recipes as any, st.foods as any));
        st.logs = st.logs.filter((l) => l.planItemId !== itemId);
        st.logs.push({ id: uid(), date, slot, name: itemName(it as PlanItem, st.recipes as any), ...mac, planItemId: itemId, prelogged: !!prelogged, at: Date.now() });
      }),
      unlogItem: (itemId) => set((st) => { st.logs = st.logs.filter((l) => l.planItemId !== itemId); }),
      syncLog: (itemId) => set((st) => {
        const log = st.logs.find((l) => l.planItemId === itemId);
        if (!log) return;
        const f = findItem(st as State, itemId);
        if (!f) { st.logs = st.logs.filter((l) => l.planItemId !== itemId); return; }
        const mac: Macros = round(itemMacros(f.item, st.recipes as any, st.foods as any));
        Object.assign(log, mac, { name: itemName(f.item, st.recipes as any), date: f.date, slot: f.slot });
      }),
      addLog: (e) => set((st) => { st.logs.push({ ...e, id: uid(), at: Date.now() }); }),
      generateGroceries: (dates) => set((st) => {
        const gen = buildGroceries(dates.map((d) => st.plans[d] as DayPlan), st.recipes as any, st.foods as any, st.owned);
        st.groceries = mergeGroceries(st.groceries as GroceryItem[], gen);
      }),
      replaceAll: (ns) => set(() => migrate({ ...initialState(), ...ns, settings: { ...initialState().settings, ...(ns.settings ?? {}) }, foods: { ...initialState().foods, ...(ns.foods ?? {}) }, recipes: { ...initialState().recipes, ...(ns.recipes ?? {}) } }))
    })),
    {
      name: 'my-glow-up',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => {
        const { set: _a, ensureWeek: _b, generateWeek: _c, logItem: _d, unlogItem: _e, syncLog: _f, addLog: _g, generateGroceries: _h, replaceAll: _i, ...rest } = s;
        return rest;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        const init = initialState();
        const existing = !!p.settings;
        const foods = { ...init.foods, ...(p.foods ?? {}) };
        for (const id of Object.keys(foods)) if (!foods[id].tags && init.foods[id]?.tags) foods[id] = { ...foods[id], tags: init.foods[id].tags };
        return migrate({
          ...current,
          ...p,
          // people who used the app before onboarding existed are already set up
          settings: { ...init.settings, ...(existing ? { onboarded: true, startWeight: 178, goalWeight: 150, name: 'beautiful' } : {}), ...(p.settings ?? {}) },
          // keep newly added seed foods/recipes available after updates
          foods,
          recipes: { ...init.recipes, ...(p.recipes ?? {}) }
        } as Store) as Store;
      }
    }
  )
);

/** Upgrade data saved by older versions (also applied to cloud copies and imported backups). */
export function migrate<T extends State>(st: T): T {
  const settings = { ...st.settings } as any;
  let water = st.water;
  if (!settings.waterOz) {
    // water used to be counted in 8 oz glasses
    water = Object.fromEntries(Object.entries(st.water ?? {}).map(([d, n]) => [d, (n as number) * 8]));
    settings.waterTarget = Math.max(8, (settings.waterTarget ?? 8) * 8);
    settings.waterOz = true;
  }
  if (Array.isArray(settings.navTabs) && settings.navTabs.includes('home')) {
    const t = settings.navTabs.filter((x: string) => x !== 'home');
    if (!t.includes('groceries') && t.length < 5) t.push('groceries');
    settings.navTabs = t;
  }
  for (const id of Object.keys(st.foods ?? {})) {
    const seed = SEED_BY_ID[id];
    if (seed && !st.foods[id].tags) st.foods = { ...st.foods, [id]: { ...st.foods[id], tags: seed.tags } };
  }
  return { ...st, settings, water };
}
const SEED_BY_ID = Object.fromEntries(SEED_FOODS.map((f) => [f.id, f]));

export const stateOnly = (s: Store): State => {
  const { set: _a, ensureWeek: _b, generateWeek: _c, logItem: _d, unlogItem: _e, syncLog: _f, addLog: _g, generateGroceries: _h, replaceAll: _i, ...rest } = s;
  return rest as State;
};
