import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import type { GroceryCategory, Ingredient, Recipe, Slot, Unit } from '../lib/types';
import { GROCERY_CATEGORIES, SLOT_LABEL, SLOTS } from '../lib/types';
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
  const [newIng, setNewIng] = useState(false);
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
      <div className="grid grid-cols-2 gap-2">
        <Field label="Meal type"><select className="field" value={r.slot} onChange={(e) => setR({ ...r, slot: e.target.value as Slot })}>{SLOTS.map((x) => <option key={x} value={x}>{SLOT_LABEL[x]}</option>)}</select></Field>
        <Field label="Portion label"><input className="field" value={r.servingLabel} onChange={(e) => setR({ ...r, servingLabel: e.target.value })} /></Field>
      </div>
      <div className="rounded-2xl bg-petal p-3 mb-3 text-[14px]">Per portion: <b>≈ {mac.cal} cal</b> · {mac.protein} g protein · {mac.carbs} g carbs · {mac.fat} g fat</div>

      <div className="label">Ingredients</div>
      <div className="space-y-2 mb-3">
        {r.ingredients.map((ing, i) => {
          const food = s.foods[ing.foodId];
          if (!food) return null;
          const m = round(ingredientMacros(s.foods, ing));
          return (
            <div key={i} className="rounded-2xl border border-line bg-card p-3">
              <div className="flex justify-between gap-2 items-start">
                <div className="text-[14px] font-medium">{food.name}{food.state ? <span className="text-muted font-normal"> · {food.state}</span> : null}</div>
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
      <div className="flex gap-2 mb-3">
        <select className="field flex-1" value={addFood} onChange={(e) => { if (e.target.value === '__new') { setNewIng(true); setAddFood(''); } else setAddFood(e.target.value); }} aria-label="Food to add">
          <option value="">Add an ingredient…</option>
          <option value="__new">＋ New ingredient (not on the list)</option>
          {foods.map((f) => <option key={f.id} value={f.id}>{f.name}{f.state ? ` (${f.state})` : ''}</option>)}
        </select>
        <button className="btn-soft" disabled={!addFood} onClick={() => {
          const f = s.foods[addFood];
          const u = unitsFor(f)[0];
          setR({ ...r, ingredients: [...r.ingredients, { foodId: addFood, amount: u === 'g' ? 100 : 1, unit: u }] });
          setAddFood('');
        }}><Plus size={18} /></button>
      </div>
      {!newIng ? (
        <button className="text-[13px] text-deep font-medium -mt-3 mb-3 block" onClick={() => setNewIng(true)}>＋ Ingredient not on the list? Add your own</button>
      ) : (
        <NewIngredient onCancel={() => setNewIng(false)} onAdd={(foodId, amount, unit) => { setR({ ...r, ingredients: [...r.ingredients, { foodId, amount, unit }] }); setNewIng(false); }} />
      )}

      <div className="label">Steps</div>
      {r.instructions.map((t, i) => (
        <textarea key={i} className="field py-2 mb-2 min-h-[64px]" value={t} placeholder={`Step ${i + 1}`}
          onChange={(e) => setR({ ...r, instructions: r.instructions.map((x, j) => (j === i ? e.target.value : x)) })} />
      ))}
      <button className="btn-ghost btn-sm mb-3" onClick={() => setR({ ...r, instructions: [...r.instructions, ''] })}><Plus size={16} />Add step</button>
      <Field label="Note (optional)"><input className="field" value={r.note ?? ''} onChange={(e) => setR({ ...r, note: e.target.value })} /></Field>
      {sharing && <ShareRecipeSheet recipe={r} onClose={() => setSharing(false)} />}
    </Sheet>
  );
}

/** Quick custom ingredient: enter it from the package label (per serving) and add it to the recipe. */
function NewIngredient({ onAdd, onCancel }: { onAdd: (foodId: string, amount: number, unit: Unit) => void; onCancel: () => void }) {
  const s = useStore();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'g' | 'each'>('g');
  const [serv, setServ] = useState<number | null>(100);
  const [pieceG, setPieceG] = useState<number | null>(null);
  const [cal, setCal] = useState<number | null>(null);
  const [pro, setPro] = useState<number | null>(null);
  const [carb, setCarb] = useState<number | null>(null);
  const [fat, setFat] = useState<number | null>(null);
  const [category, setCategory] = useState<GroceryCategory>('Pantry');
  const grams = mode === 'g' ? serv : (pieceG ?? 50);
  const ok = name.trim() && cal != null && grams && grams > 0;
  const add = () => {
    if (!ok) return;
    const k = 100 / grams!;
    const id = uid();
    s.set((x) => {
      x.foods[id] = {
        id, name: name.trim(), category, estimate: false, custom: true, tags: [],
        per100g: { cal: +(cal! * k).toFixed(1), protein: +((pro ?? 0) * k).toFixed(2), carbs: +((carb ?? 0) * k).toFixed(2), fat: +((fat ?? 0) * k).toFixed(2) },
        units: mode === 'each' ? { each: grams! } : {},
        eachLabel: mode === 'each' ? 'serving' : undefined,
        grocery: { key: id, name: name.trim(), factor: 1, unitLabel: mode === 'each' ? 'servings' : 'g', gramsPerUnit: mode === 'each' ? grams! : 1, round: 'ceil' }
      };
    });
    toast(`Added ${name.trim()} to your foods`);
    onAdd(id, mode === 'each' ? 1 : grams!, mode === 'each' ? 'each' : 'g');
  };
  return (
    <div className="rounded-2xl border border-blush bg-petal/40 p-3 mb-3">
      <div className="font-medium mb-2">New ingredient</div>
      <Field label="Name"><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chipotle mayo" /></Field>
      <div className="label">Nutrition from the label is for…</div>
      <div className="flex gap-2 mb-3">
        <button className={`chip ${mode === 'g' ? 'chip-on' : ''}`} onClick={() => setMode('g')}>A weight in grams</button>
        <button className={`chip ${mode === 'each' ? 'chip-on' : ''}`} onClick={() => setMode('each')}>1 serving / piece</button>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        {mode === 'g'
          ? <Field label="Grams"><NumberInput value={serv} onChange={setServ} ariaLabel="Serving grams" /></Field>
          : <Field label="Grams per serving (optional)"><NumberInput value={pieceG} onChange={setPieceG} placeholder="50" ariaLabel="Grams per serving" /></Field>}
        <Field label="Calories"><NumberInput value={cal} onChange={setCal} ariaLabel="New ingredient calories" /></Field>
        <Field label="Protein (g)"><NumberInput value={pro} onChange={setPro} ariaLabel="New ingredient protein" /></Field>
        <Field label="Carbs (g)"><NumberInput value={carb} onChange={setCarb} /></Field>
        <Field label="Fat (g)"><NumberInput value={fat} onChange={setFat} /></Field>
        <Field label="Grocery aisle"><select className="field" value={category} onChange={(e) => setCategory(e.target.value as GroceryCategory)}>{GROCERY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      </div>
      <div className="flex gap-2">
        <button className="btn-ghost btn-sm flex-1" onClick={onCancel}>Cancel</button>
        <button className="btn-primary btn-sm flex-[2]" disabled={!ok} onClick={add}>Add to recipe</button>
      </div>
    </div>
  );
}
