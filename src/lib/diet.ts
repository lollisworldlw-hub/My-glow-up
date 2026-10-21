import type { Diet, Food, FoodTag, Recipe } from './types';
import { DIETS } from './types';

export const avoidTags = (diets: Diet[]): Set<FoodTag> => new Set(diets.flatMap((d) => DIETS.find((x) => x.v === d)?.avoid ?? []));

export function recipeTags(r: Recipe, foods: Record<string, Food>): Set<FoodTag> {
  const t = new Set<FoodTag>();
  for (const i of r.ingredients) for (const x of foods[i.foodId]?.tags ?? []) t.add(x);
  return t;
}

/** Ingredients that conflict with the person's diet (empty = fits). */
export function conflicts(r: Recipe, foods: Record<string, Food>, diets: Diet[]): string[] {
  const avoid = avoidTags(diets);
  if (!avoid.size) return [];
  return r.ingredients.filter((i) => (foods[i.foodId]?.tags ?? []).some((t) => avoid.has(t))).map((i) => foods[i.foodId]?.name ?? '');
}

export const fitsDiet = (r: Recipe, foods: Record<string, Food>, diets: Diet[]) => conflicts(r, foods, diets).length === 0;

export function dietBadges(r: Recipe, foods: Record<string, Food>): string[] {
  const t = recipeTags(r, foods);
  const b: string[] = [];
  const has = (...x: FoodTag[]) => x.some((y) => t.has(y));
  if (!has('meat', 'poultry', 'fish', 'shellfish', 'dairy', 'egg')) b.push('Vegan');
  else if (!has('meat', 'poultry', 'fish', 'shellfish')) b.push('Vegetarian');
  else if (!has('meat', 'poultry')) b.push('Pescatarian');
  if (!has('gluten')) b.push('GF');
  if (!has('dairy')) b.push('DF');
  return b;
}
