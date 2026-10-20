import type { DayPlan, Food, GroceryItem, Recipe } from './types';
import { SLOTS } from './types';
import { gramsOf, itemIngredients } from './nutrition';
import { uid } from './date';

const roundQty = (n: number, mode: 'quarter' | 'half' | 'ceil') =>
  mode === 'ceil' ? Math.max(1, Math.ceil(n - 1e-6)) : mode === 'half' ? Math.max(0.5, Math.ceil(n * 2 - 1e-6) / 2) : Math.max(0.25, Math.ceil(n * 4 - 1e-6) / 4);

/**
 * Build a combined grocery list from planned days.
 * Ingredients that share a grocery key (e.g. rice in two recipes) are merged,
 * and cooked weights are converted back to raw purchase amounts.
 */
export function buildGroceries(
  days: (DayPlan | undefined)[],
  recipes: Record<string, Recipe>,
  foods: Record<string, Food>,
  owned: string[]
): GroceryItem[] {
  const totals = new Map<string, { grams: number; food: Food }>();
  for (const day of days) {
    if (!day) continue;
    for (const slot of SLOTS) {
      for (const item of day[slot] ?? []) {
        for (const ing of itemIngredients(item, recipes)) {
          const food = foods[ing.foodId];
          if (!food) continue;
          const grams = gramsOf(food, ing.amount, ing.unit) * item.servings * food.grocery.factor;
          const cur = totals.get(food.grocery.key);
          totals.set(food.grocery.key, { grams: (cur?.grams ?? 0) + grams, food: cur?.food ?? food });
        }
      }
    }
  }
  const out: GroceryItem[] = [];
  for (const [key, { grams, food }] of totals) {
    if (owned.includes(key) || grams <= 0) continue;
    const gr = food.grocery;
    out.push({
      id: uid(), key, name: gr.name, qty: roundQty(grams / gr.gramsPerUnit, gr.round), unit: gr.unitLabel,
      category: food.category, checked: false, source: 'plan', price: null
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Merge a fresh generated list into the existing one, keeping custom items and checked state. */
export function mergeGroceries(existing: GroceryItem[], generated: GroceryItem[]): GroceryItem[] {
  const custom = existing.filter((i) => i.source === 'custom');
  const prev = new Map(existing.filter((i) => i.source === 'plan' && i.key).map((i) => [i.key!, i]));
  return [
    ...generated.map((g) => {
      const p = prev.get(g.key!);
      return p ? { ...g, id: p.id, checked: p.checked && p.qty === g.qty, price: p.price ?? null } : g;
    }),
    ...custom
  ];
}

export function groceryText(items: GroceryItem[], categories: string[]) {
  const lines: string[] = ['My Glow-Up grocery list', ''];
  for (const c of categories) {
    const list = items.filter((i) => i.category === c && !i.checked);
    if (!list.length) continue;
    lines.push(c.toUpperCase());
    for (const i of list) lines.push(`☐ ${i.name}${i.qty != null ? ` — ${i.qty} ${i.unit}` : ''}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}
