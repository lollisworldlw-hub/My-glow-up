import { supabase } from './sync';
import { useStore } from './store';
import { uid } from './date';
import type { Food, GroceryCategory, Recipe, Slot } from './types';

export interface AiFood { name: string; amount: string; cal: number; protein: number; carbs: number; fat: number }

async function call(body: Record<string, unknown>) {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) throw new Error('Sign in to use this.');
  const { data, error } = await supabase.functions.invoke('glowup-ai', { body });
  if (error) {
    let msg = error.message;
    try { msg = (await (error as any).context.json()).error ?? msg; } catch { /* */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

const toBase64 = (b: Blob) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(',')[1]);
  r.onerror = rej;
  r.readAsDataURL(b);
});

export async function estimateFoods(text: string, image?: Blob): Promise<{ items: AiFood[]; note?: string }> {
  const body: Record<string, unknown> = { action: 'food', text };
  if (image) { body.image = await toBase64(image); body.mediaType = image.type || 'image/jpeg'; }
  const out = await call(body);
  return { items: (out.items ?? []).map((i: AiFood) => ({ ...i, cal: Math.round(i.cal), protein: Math.round(i.protein), carbs: Math.round(i.carbs), fat: Math.round(i.fat) })), note: out.note };
}

const CAT: Record<string, GroceryCategory> = {
  Produce: 'Vegetables', 'Meat & Seafood': 'Protein', 'Dairy & Eggs': 'Dairy', Bakery: 'Grains', Pantry: 'Pantry', Frozen: 'Pantry', 'Spices & Condiments': 'Sauces', Other: 'Pantry'
};

/** Turn a link (or pasted caption/recipe text) into a saved recipe. Returns the new recipe id. */
export async function importRecipe(url: string, text: string): Promise<string> {
  const out = await call({ action: 'recipe', url: url.trim() || undefined, text });
  if (!out.found || !out.ingredients?.length) throw new Error('Couldn’t find a recipe there. Try pasting the ingredients and steps instead.');
  const servings = Math.max(1, Number(out.servings) || 1);
  const st = useStore.getState();
  const ingredients: Recipe['ingredients'] = [];
  const newFoods: Record<string, Food> = {};
  for (const ing of out.ingredients) {
    const name = String(ing.name).trim();
    const existing = Object.values(st.foods).find((f) => f.name.toLowerCase() === name.toLowerCase());
    let id = existing?.id;
    if (!id) {
      id = uid();
      newFoods[id] = {
        id, name, state: ing.state, category: CAT[ing.category] ?? 'Pantry', estimate: true, custom: true, tags: [],
        per100g: { cal: +(+ing.per100g.cal).toFixed(1), protein: +(+ing.per100g.protein).toFixed(1), carbs: +(+ing.per100g.carbs).toFixed(1), fat: +(+ing.per100g.fat).toFixed(1) },
        units: {}, grocery: { key: id, name, factor: 1, unitLabel: 'g', gramsPerUnit: 1, round: 'ceil' }
      } as Food;
    }
    ingredients.push({ foodId: id, amount: Math.max(1, Math.round((Number(ing.grams) || 0) / servings)), unit: 'g' });
  }
  const slot: Slot = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'].includes(out.slot) ? out.slot : 'dinner';
  const rid = uid();
  st.set((x) => {
    Object.assign(x.foods, newFoods);
    x.recipes[rid] = { id: rid, name: out.name || 'Imported recipe', slot, servingLabel: out.servingLabel || '1 serving', ingredients, instructions: out.steps ?? [], art: 'custom', custom: true, note: url ? `From ${url}` : undefined };
  });
  return rid;
}
