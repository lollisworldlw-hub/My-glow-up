import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import type { Ingredient, Recipe, Slot, Unit } from '../lib/types';
import { SLOT_LABEL, SLOTS } from '../lib/types';
import { ingredientMacros, round, sumIngredients, unitsFor } from '../lib/nutrition';
import { uid } from '../lib/date';
import { Field, NumberInput, Sheet, toast } from './ui';
import { ShareRecipeSheet, useCanShare } from './ShareParts';

export function RecipeEditor({ recipeId, slot = 'dinner', onClose }: { recipeId?: string; slot?: Slot; onClose: () => void }) {
  const s = useStore();
  const orig = recipeId ? s.recipes[recipeId] : undefined;
  const [r, setR] = useState<Recipe>(() => orig ? JSON.parse(JSON.stringify(orig)) : {
    id: uid(), name: '', slot, servingLabel: '1 serving', ingredients: [], instructions: [''], art: slot === 'dessert' ? 'choc-berry' : 'custom', custom: true
  });
  const [addFood, setAddFood] = useState('');
  const [sharing, setSharing] = useState(false);
  const canShare = useCanShare();
  const foods = Object.values(s.foods).sort((a, b) => a.name.localeCompare(b.name));
  const mac = round(sumIngredients(s.foods, r.ingredients));
  const setIng = (i: number, p: Partial<Ingredient>) => setR({ ...r, ingredients: r.ingredients.map((x, j) => (j === i ? { ...x, ...p } : x)) });

  const save = () => {
    if (!r.name.trim()) { toast('Give your recipe a name'); return; }
    s.set((st) => { st.recipes[r.id] = { ...r, name: r.name.trim(), instructions: r.instructions.filter((x) => x.trim()) }; });
    toast(orig ? 'Recipe updated' : 'Recipe added ♡');
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={orig ? 'Edit recipe' : 'New recipe'}
      footer={<div className="flex gap-2">
        {orig?.custom && <button className="btn-ghost flex-1" onClick={() => {
          s.set((st) => { delete st.recipes[r.id]; st.favorites = st.favorites.filter((x) => x !== r.id); });
          toast('Recipe deleted'); onClose();
        }}><Trash2 size={16} />Delete</button>}
        {orig && <button className="btn-soft flex-1" onClick={() => canShare() && setSharing(true)}>Share</button>}
        <button className="btn-primary flex-[2]" onClick={save}>Save recipe</button>
      </div>}>
      <Field label="Name"><input className="field" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} placeholder="e.g. Chocolate banana bites" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Meal type"><select className="field" value={r.slot} onChange={(e) => setR({ ...r, slot: e.target.value as Slot })}>{SLOTS.map((x) => <option key={x} value={x}>{SLOT_LABEL[x]}</option>)}</select></Field>
        <Field label="Portion label"><input className="field" value={r.servingLabel} onChange={(e) => setR({ ...r, servingLabel: e.target.value })} /></Field>
      </div>
      <div className="rounded-2xl bg-petal p-3 mb-4 text-[15px]">Per portion: <b>≈ {mac.cal} cal</b> · {mac.protein} g protein · {mac.carbs} g carbs · {mac.fat} g fat</div>

      <div className="label">Ingredients</div>
      <div className="space-y-2 mb-3">
        {r.ingredients.map((ing, i) => {
          const food = s.foods[ing.foodId];
          if (!food) return null;
          const m = round(ingredientMacros(s.foods, ing));
          return (
            <div key={i} className="rounded-2xl border border-line bg-card p-3">
              <div className="flex justify-between gap-2 items-start">
                <div className="text-[15px] font-medium">{food.name}{food.state ? <span className="text-muted font-normal"> · {food.state}</span> : null}</div>
                <button aria-label="Remove ingredient" className="text-muted p-1" onClick={() => setR({ ...r, ingredients: r.ingredients.filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
              </div>
              <div className="flex gap-2 mt-2 items-center">
                <div className="w-24"><NumberInput value={ing.amount} onChange={(v) => v != null && setIng(i, { amount: v })} ariaLabel="Amount" /></div>
                <select className="field flex-1" value={ing.unit} onChange={(e) => setIng(i, { unit: e.target.value as Unit })}>{unitsFor(food).map((u) => <option key={u} value={u}>{u === 'each' ? food.eachLabel ?? 'each' : u}</option>)}</select>
                <div className="text-[13px] text-muted w-16 text-right tabular-nums">{m.cal} cal</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mb-5">
        <select className="field flex-1" value={addFood} onChange={(e) => setAddFood(e.target.value)} aria-label="Food to add">
          <option value="">Add an ingredient…</option>
          {foods.map((f) => <option key={f.id} value={f.id}>{f.name}{f.state ? ` (${f.state})` : ''}</option>)}
        </select>
        <button className="btn-soft" disabled={!addFood} onClick={() => {
          const f = s.foods[addFood];
          const u = unitsFor(f)[0];
          setR({ ...r, ingredients: [...r.ingredients, { foodId: addFood, amount: u === 'g' ? 100 : 1, unit: u }] });
          setAddFood('');
        }}><Plus size={18} /></button>
      </div>
      <p className="text-[13px] text-muted -mt-3 mb-5">Missing a food? Add it with its label values in Settings → Food library.</p>

      <div className="label">Steps</div>
      {r.instructions.map((t, i) => (
        <textarea key={i} className="field py-3 mb-2 min-h-[64px]" value={t} placeholder={`Step ${i + 1}`}
          onChange={(e) => setR({ ...r, instructions: r.instructions.map((x, j) => (j === i ? e.target.value : x)) })} />
      ))}
      <button className="btn-ghost btn-sm mb-4" onClick={() => setR({ ...r, instructions: [...r.instructions, ''] })}><Plus size={16} />Add step</button>
      <Field label="Note (optional)"><input className="field" value={r.note ?? ''} onChange={(e) => setR({ ...r, note: e.target.value })} /></Field>
      {sharing && <ShareRecipeSheet recipe={r} onClose={() => setSharing(false)} />}
    </Sheet>
  );
}
