import type { Food, Recipe } from './types';
import type { State } from './store';
import { uid } from './date';
import { recipeMacros, round } from './nutrition';

export interface RecipePayload { recipe: Recipe; foods: Food[]; macros: { cal: number; protein: number } }

export function recipePayload(r: Recipe, foods: Record<string, Food>): RecipePayload {
  const used = [...new Set(r.ingredients.map((i) => i.foodId))].map((id) => foods[id]).filter(Boolean);
  const m = round(recipeMacros(foods, r));
  return { recipe: JSON.parse(JSON.stringify(r)), foods: JSON.parse(JSON.stringify(used)), macros: { cal: m.cal, protein: m.protein } };
}

/** Add a friend's shared recipe (and any foods it needs) to my recipes. Returns the new recipe id. */
export function importRecipe(s: State, p: RecipePayload, from: string): { recipes: Record<string, Recipe>; foods: Record<string, Food>; id: string; existed: boolean } {
  const foods = { ...s.foods };
  const idMap: Record<string, string> = {};
  for (const f of p.foods) {
    const mine = foods[f.id];
    if (!mine) foods[f.id] = { ...f, custom: true };
    else if (mine.custom && JSON.stringify(mine.per100g) !== JSON.stringify(f.per100g)) {
      const nid = uid(); idMap[f.id] = nid; foods[nid] = { ...f, id: nid, custom: true, name: `${f.name} (${from})` };
    }
  }
  const already = Object.values(s.recipes).find((r) => r.name === p.recipe.name && r.slot === p.recipe.slot && JSON.stringify(r.ingredients) === JSON.stringify(p.recipe.ingredients));
  if (already) return { recipes: s.recipes, foods, id: already.id, existed: true };
  const id = uid();
  const recipe: Recipe = { ...p.recipe, id, custom: true, note: [p.recipe.note, `Shared by ${from} ♡`].filter(Boolean).join(' · '),
    ingredients: p.recipe.ingredients.map((i) => ({ ...i, foodId: idMap[i.foodId] ?? i.foodId })) };
  return { recipes: { ...s.recipes, [id]: recipe }, foods, id, existed: false };
}
