export type Slot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export const SLOTS: Slot[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Afternoon snack',
  dessert: 'Nighttime dessert'
};

export type Unit = 'g' | 'oz' | 'lb' | 'cup' | 'tbsp' | 'tsp' | 'each';
export const UNIT_LABEL: Record<Unit, string> = {
  g: 'g', oz: 'oz', lb: 'lb', cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', each: 'each'
};

export type GroceryCategory =
  | 'Protein' | 'Dairy' | 'Grains' | 'Fruits' | 'Vegetables' | 'Pantry' | 'Sauces' | 'Desserts';
export const GROCERY_CATEGORIES: GroceryCategory[] = [
  'Protein', 'Dairy', 'Grains', 'Fruits', 'Vegetables', 'Pantry', 'Sauces', 'Desserts'
];

export interface Macros { cal: number; protein: number; carbs: number; fat: number }

export interface Food {
  id: string;
  name: string;
  /** cooked / raw / dry / prepared — shown next to weights */
  state?: 'cooked' | 'raw' | 'dry' | 'prepared' | 'packaged';
  category: GroceryCategory;
  per100g: Macros;
  /** grams per unit for volume / count units */
  units: Partial<Record<'cup' | 'tbsp' | 'tsp' | 'each', number>>;
  eachLabel?: string; // e.g. "slice", "egg", "bar"
  estimate: boolean; // true = generic estimate, false = edited from a label
  note?: string;
  grocery: {
    key: string;
    name: string;
    /** purchased grams per eaten gram (e.g. raw chicken per cooked chicken) */
    factor: number;
    unitLabel: string;
    gramsPerUnit: number;
    round: 'quarter' | 'half' | 'ceil';
    pantry?: boolean;
  };
  custom?: boolean;
  tags?: FoodTag[];
}

export type FoodTag = 'meat' | 'poultry' | 'fish' | 'shellfish' | 'dairy' | 'egg' | 'gluten' | 'nuts' | 'soy';
export const FOOD_TAGS: { v: FoodTag; l: string }[] = [
  { v: 'meat', l: 'Red meat / pork' }, { v: 'poultry', l: 'Poultry' }, { v: 'fish', l: 'Fish' }, { v: 'shellfish', l: 'Shellfish' },
  { v: 'dairy', l: 'Dairy' }, { v: 'egg', l: 'Egg' }, { v: 'gluten', l: 'Gluten' }, { v: 'nuts', l: 'Nuts' }, { v: 'soy', l: 'Soy' }
];
export type Diet = 'vegetarian' | 'pescatarian' | 'vegan' | 'no-red-meat' | 'gluten-free' | 'dairy-free' | 'egg-free' | 'nut-free' | 'shellfish-free' | 'soy-free';
export const DIETS: { v: Diet; l: string; avoid: FoodTag[] }[] = [
  { v: 'vegetarian', l: 'Vegetarian', avoid: ['meat', 'poultry', 'fish', 'shellfish'] },
  { v: 'pescatarian', l: 'Pescatarian', avoid: ['meat', 'poultry'] },
  { v: 'vegan', l: 'Vegan', avoid: ['meat', 'poultry', 'fish', 'shellfish', 'dairy', 'egg'] },
  { v: 'no-red-meat', l: 'No red meat / pork', avoid: ['meat'] },
  { v: 'gluten-free', l: 'Gluten-free', avoid: ['gluten'] },
  { v: 'dairy-free', l: 'Dairy-free', avoid: ['dairy'] },
  { v: 'egg-free', l: 'Egg-free', avoid: ['egg'] },
  { v: 'nut-free', l: 'Nut-free', avoid: ['nuts'] },
  { v: 'shellfish-free', l: 'Shellfish-free', avoid: ['shellfish'] },
  { v: 'soy-free', l: 'Soy-free', avoid: ['soy'] }
];

export interface Ingredient { foodId: string; amount: number; unit: Unit }

export interface Recipe {
  id: string;
  name: string;
  slot: Slot;
  servingLabel: string;
  ingredients: Ingredient[];
  instructions: string[];
  note?: string;
  art: string; // key for illustration
  custom?: boolean;
}

export interface PlanItem {
  id: string;
  recipeId?: string;
  /** quick item without recipe */
  quick?: { name: string } & Macros;
  servings: number; // multiplier
  /** per-meal ingredient amounts overriding the recipe */
  ingredients?: Ingredient[];
}

export type DayPlan = Record<Slot, PlanItem[]>;

export interface LogEntry {
  id: string;
  date: string;
  slot: Slot;
  name: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  planItemId?: string;
  prelogged?: boolean;
  at: number;
}

export interface WeightEntry { id: string; date: string; lbs: number }

export type MeasureKey = 'waistNavel' | 'waistSmall' | 'hips' | 'bust' | 'thigh' | 'arm' | 'neck';
export const MEASURES: { key: MeasureKey; label: string }[] = [
  { key: 'waistNavel', label: 'Waist at belly button' },
  { key: 'waistSmall', label: 'Smallest waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'bust', label: 'Bust' },
  { key: 'thigh', label: 'Thigh' },
  { key: 'arm', label: 'Upper arm' },
  { key: 'neck', label: 'Neck (optional)' }
];
export interface MeasureEntry { id: string; date: string; values: Partial<Record<MeasureKey, number>> }

export type Pose = 'front' | 'side' | 'back' | 'face';
export interface PhotoMeta { id: string; date: string; pose: Pose; w: number; h: number }

export type HomeWorkoutType = 'strength' | 'bike' | 'bike-easy' | 'rest';
export interface ScheduleDay {
  walk: 'walk' | 'optional' | 'recovery';
  home: HomeWorkoutType;
  homeOptional: boolean;
}

export interface WorkoutLog {
  id: string;
  date: string;
  type: 'walk' | 'strength' | 'bike-moderate' | 'bike-intervals' | 'bike-easy' | 'other';
  name: string;
  plannedMin: number;
  actualMin: number;
  completed: boolean;
  difficulty?: number;
  reps?: Record<string, number[]>;
  levels?: Record<string, number>;
  at: number;
}

export type HabitRule = 'daily' | 'walk-days' | 'workout-days';
export interface Habit {
  id: string;
  name: string;
  rule: HabitRule;
  optional: boolean;
  home: boolean;
  auto?: 'walk' | 'workout' | 'protein' | 'water' | 'dessert';
}

export interface GroceryItem {
  id: string;
  key?: string;
  name: string;
  qty: number | null;
  unit: string;
  category: GroceryCategory;
  price?: number | null;
  checked: boolean;
  source: 'plan' | 'custom';
}

export interface PrepTask {
  id: string;
  title: string;
  minutes: number;
  instructions: string;
  ingredients: string[];
}

export interface Settings {
  name: string;
  startWeight: number;
  goalWeight: number;
  heightIn: number;
  age: number;
  calTarget: number;
  calMin: number;
  calMax: number;
  proteinMin: number;
  proteinMax: number;
  waterTarget: number; // ounces
  waterOz?: boolean;
  workoutMinutes: number;
  walkMinutes: number;
  weightUnit: 'lb' | 'kg';
  lengthUnit: 'in' | 'cm';
  theme: 'light' | 'dark' | 'system';
  lookV3?: boolean;
  palette?: 'euca' | 'sage' | 'noir' | 'ocean' | 'sand' | 'lavender' | 'rose';
  dislikes: string[];
  autoFillWeeks: boolean;
  sound: boolean;
  vibration: boolean;
  reminders: { id: string; label: string; time: string; on: boolean; days?: number[] }[];
  pushOn?: boolean;
  notifyMessages?: boolean;
  notifyReactions?: boolean;
  startDate: string;
  moveNudge: { on: boolean; start: string; end: string };
  stepsGoal: number;
  cycleOnHome: boolean;
  onboarded: boolean;
  sex: 'female' | 'male' | 'other';
  activity: 'sedentary' | 'light' | 'moderate';
  diets: Diet[];
  navTabs: string[];
  quotes: string[];
  prepDays: { sunday: number; wednesday: number };
  inviteCode?: string;
}

export interface MoodEntry { mood: number; tags: string[]; note: string; gratitude: string[] }
export interface MindGoal { id: string; name: string; perWeek: number; icon: string }
export type CleanFreq = 'daily' | 'weekly' | 'every' | 'monthly';
export interface CleanTask {
  id: string;
  name: string;
  room: string;
  freq: CleanFreq;
  days?: number[]; // weekly: JS weekdays
  every?: number; // every N days
  monthDay?: number;
  minutes: number;
  lastDone?: string;
}

export interface Checkin {
  weekStart: string;
  wins: string;
  challenge: string;
  focus: string;
  at: number;
}

export type Flow = 'spotting' | 'light' | 'medium' | 'heavy';
export interface Period { id: string; start: string; end?: string }
export interface CycleDay { flow?: Flow; symptoms: string[] }

export interface FoodPhoto { id: string; date: string; slot?: Slot; caption: string; w: number; h: number; sharedAt?: number }
