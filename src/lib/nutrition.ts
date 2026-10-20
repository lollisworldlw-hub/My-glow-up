import type { Food, Ingredient, Macros, PlanItem, Recipe, Unit } from './types';

export const ZERO: Macros = { cal: 0, protein: 0, carbs: 0, fat: 0 };
export const add = (a: Macros, b: Macros): Macros => ({
  cal: a.cal + b.cal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat
});
export const scale = (a: Macros, k: number): Macros => ({
  cal: a.cal * k, protein: a.protein * k, carbs: a.carbs * k, fat: a.fat * k
});
export const round = (a: Macros): Macros => ({
  cal: Math.round(a.cal), protein: Math.round(a.protein), carbs: Math.round(a.carbs), fat: Math.round(a.fat)
});

/** Units available for a food. Weight units always work. */
export const unitsFor = (food: Food): Unit[] => {
  const u: Unit[] = [];
  if (food.units.each) u.push('each');
  u.push('g', 'oz');
  if (food.units.cup) u.push('cup');
  if (food.units.tbsp || food.units.cup) u.push('tbsp');
  if (food.units.tsp || food.units.tbsp || food.units.cup) u.push('tsp');
  return u;
};

export function gramsOf(food: Food, amount: number, unit: Unit): number {
  const u = food.units;
  switch (unit) {
    case 'g': return amount;
    case 'oz': return amount * 28.3495;
    case 'lb': return amount * 453.592;
    case 'each': return amount * (u.each ?? 0);
    case 'cup': return amount * (u.cup ?? (u.tbsp ? u.tbsp * 16 : 0));
    case 'tbsp': return amount * (u.tbsp ?? (u.cup ? u.cup / 16 : u.tsp ? u.tsp * 3 : 0));
    case 'tsp': return amount * (u.tsp ?? (u.tbsp ? u.tbsp / 3 : u.cup ? u.cup / 48 : 0));
  }
}

export const macrosForGrams = (food: Food, grams: number): Macros => scale(food.per100g, grams / 100);

export function ingredientMacros(foods: Record<string, Food>, ing: Ingredient): Macros {
  const food = foods[ing.foodId];
  if (!food) return ZERO;
  return macrosForGrams(food, gramsOf(food, ing.amount, ing.unit));
}

export const sumIngredients = (foods: Record<string, Food>, ings: Ingredient[]) =>
  ings.reduce((acc, i) => add(acc, ingredientMacros(foods, i)), ZERO);

export const recipeMacros = (foods: Record<string, Food>, recipe: Recipe) => sumIngredients(foods, recipe.ingredients);

export function itemIngredients(item: PlanItem, recipes: Record<string, Recipe>): Ingredient[] {
  if (item.ingredients) return item.ingredients;
  return recipes[item.recipeId ?? '']?.ingredients ?? [];
}

export function itemMacros(item: PlanItem, recipes: Record<string, Recipe>, foods: Record<string, Food>): Macros {
  if (item.quick) return scale(item.quick, item.servings);
  return scale(sumIngredients(foods, itemIngredients(item, recipes)), item.servings);
}

export function itemName(item: PlanItem, recipes: Record<string, Recipe>) {
  if (item.quick) return item.quick.name;
  return recipes[item.recipeId ?? '']?.name ?? 'Removed recipe';
}

/** true when any ingredient uses a generic estimate */
export function itemIsEstimate(item: PlanItem, recipes: Record<string, Recipe>, foods: Record<string, Food>) {
  if (item.quick) return false;
  return itemIngredients(item, recipes).some((i) => foods[i.foodId]?.estimate !== false);
}

const FRACTIONS: [number, string][] = [[0.25, '¼'], [0.333, '⅓'], [0.5, '½'], [0.667, '⅔'], [0.75, '¾']];
export function fmtAmount(n: number): string {
  const whole = Math.floor(n + 1e-6);
  const frac = n - whole;
  if (frac < 0.04) return String(whole);
  for (const [v, s] of FRACTIONS) if (Math.abs(frac - v) < 0.04) return whole ? `${whole}${s}` : s;
  return String(Math.round(n * 10) / 10);
}

export function fmtIngredient(food: Food | undefined, ing: Ingredient): string {
  if (!food) return 'Unknown food';
  let unit: string = ing.unit;
  if (ing.unit === 'each') unit = food.eachLabel ? (ing.amount === 1 ? food.eachLabel : plural(food.eachLabel)) : '';
  else if (ing.unit === 'cup' && ing.amount > 1) unit = 'cups';
  const state = food.state === 'cooked' || food.state === 'raw' || food.state === 'dry' ? ` (${food.state})` : '';
  return `${fmtAmount(ing.amount)}${unit ? ' ' + unit : ''} ${food.name.toLowerCase()}${state}`;
}

const plural = (s: string) => (s.endsWith('y') && !s.endsWith('ey') ? s.slice(0, -1) + 'ies' : s.endsWith('h') ? s + 'es' : s + 's');
