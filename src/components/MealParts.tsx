import { useMemo, useState } from 'react';
import { ArrowLeftRight, BookOpen, Copy, Heart, MoveRight, Plus, RotateCcw, Save, Search, Share2, Trash2 } from 'lucide-react';
import { useStore, findItem, emptyDay } from '../lib/store';
import type { Ingredient, PlanItem, Slot, Unit } from '../lib/types';
import { SLOT_LABEL, SLOTS } from '../lib/types';
import {
  fmtAmount, fmtIngredient, gramsOf, ingredientMacros, itemIngredients, itemIsEstimate, itemMacros, itemName,
  macrosForGrams, round, recipeMacros, unitsFor
} from '../lib/nutrition';
import { addDays, fmtDow, fmtShort, uid, weekDays, weekStart } from '../lib/date';
import { CheckCircle, Field, NumberInput, Segmented, Sheet, Stepper, toast } from './ui';
import { FoodArt } from './Art';
import { conflicts, dietBadges } from '../lib/diet';
import { ShareRecipeSheet, useCanShare } from './ShareParts';

export const fmtServ = (n: number) => (n === 1 ? '' : ` × ${fmtAmount(n)}`);

export function MacroLine({ cal, protein, est }: { cal: number; protein: number; est?: boolean }) {
  return (
    <span className="text-[13px] text-muted tabular-nums">
      {est && '≈ '}{Math.round(cal)} cal · {Math.round(protein)} g protein
    </span>
  );
}

/** Meal card with completion, recipe and swap controls */
export function MealCard({ date, slot, item, compact }: { date: string; slot: Slot; item: PlanItem; compact?: boolean }) {
  const s = useStore();
  const [sheet, setSheet] = useState<null | 'detail' | 'swap' | 'log'>(null);
  const recipe = item.recipeId ? s.recipes[item.recipeId] : undefined;
  const mac = itemMacros(item, s.recipes, s.foods);
  const logged = s.logs.find((l) => l.planItemId === item.id);
  const est = itemIsEstimate(item, s.recipes, s.foods);

  const toggle = () => {
    if (logged) { s.unlogItem(item.id); toast('Removed from today’s log'); }
    else setSheet('log');
  };

  return (
    <>
      <div className={`card p-4 ${logged ? 'border-sage/60' : ''}`}>
        <div className="flex gap-3 items-start">
          <button className="flex-1 min-w-0 flex gap-3 text-left" onClick={() => setSheet('detail')} aria-label={`Open ${itemName(item, s.recipes)}`}>
            <FoodArt art={recipe?.art ?? 'custom'} size={compact ? 48 : 56} />
            <div className="min-w-0 flex-1">
              <div className="eyebrow !text-[12px]">{SLOT_LABEL[slot]}</div>
              <div className="font-medium text-[14px] leading-snug">{itemName(item, s.recipes)}</div>
              <div className="text-[13px] text-muted">{recipe?.servingLabel ?? '1 serving'}{fmtServ(item.servings)}</div>
              <MacroLine cal={mac.cal} protein={mac.protein} est={est} />
              {recipe && conflicts(recipe, s.foods, s.settings.diets).length > 0 && <div className="text-[13px] text-deep mt-0.5">Contains {conflicts(recipe, s.foods, s.settings.diets).join(', ').toLowerCase()} — swap?</div>}
              {logged && <div className="text-[13px] text-sagedeep font-medium mt-0.5">{logged.prelogged ? 'Pre-logged for later ♡' : `Logged · ${logged.cal} cal`}</div>}
            </div>
          </button>
          <CheckCircle on={!!logged && !logged.prelogged} onToggle={toggle} label={`Mark ${itemName(item, s.recipes)} as eaten`} />
        </div>
        {!compact && (
          <div className="flex gap-2 mt-3">
            <button className="btn-soft btn-sm flex-1" onClick={() => setSheet('detail')}><BookOpen size={16} />Recipe</button>
            <button className="btn-soft btn-sm flex-1" onClick={() => setSheet('swap')}><ArrowLeftRight size={16} />Swap</button>
          </div>
        )}
      </div>
      {sheet === 'detail' && <MealSheet itemId={item.id} onClose={() => setSheet(null)} />}
      {sheet === 'swap' && <SwapSheet date={date} slot={slot} itemId={item.id} onClose={() => setSheet(null)} />}
      {sheet === 'log' && <LogConfirmSheet date={date} slot={slot} item={item} onClose={() => setSheet(null)} />}
    </>
  );
}

export function LogConfirmSheet({ date, slot, item, onClose }: { date: string; slot: Slot; item: PlanItem; onClose: () => void }) {
  const s = useStore();
  const [serv, setServ] = useState(item.servings);
  const name = itemName(item, s.recipes);
  const mac = round(itemMacros({ ...item, servings: serv }, s.recipes, s.foods));
  const prelog = s.logs.find((l) => l.planItemId === item.id && l.prelogged);
  return (
    <Sheet open onClose={onClose} title={`Log ${name}?`}>
      <p className="text-muted text-[14px] mb-4">Only what you actually eat counts toward today. Adjust the portion if it was different.</p>
      <div className="card p-4 flex items-center justify-between mb-4">
        <div>
          <div className="text-[13px] text-muted">Portion</div>
          <div className="font-semibold">{mac.cal} cal · {mac.protein} g protein</div>
        </div>
        <Stepper value={serv} onChange={setServ} format={(v) => `${fmtAmount(v)}×`} />
      </div>
      <button className="btn-primary w-full mb-3" onClick={() => { s.logItem(date, slot, item.id, serv); toast(serv === item.servings ? 'Logged as planned ♡' : 'Logged your portion ♡'); onClose(); }}>
        {serv === item.servings ? 'I ate this as planned' : 'Log this portion'}
      </button>
      {slot === 'dessert' && !prelog && (
        <button className="btn-soft w-full mb-3" onClick={() => { s.logItem(date, slot, item.id, serv, true); toast('Dessert saved in today’s total'); onClose(); }}>
          Pre-log for later tonight
        </button>
      )}
      <button className="btn-ghost w-full" onClick={onClose}>Not yet</button>
    </Sheet>
  );
}

const UNIT_OPTS: Unit[] = ['each', 'g', 'oz', 'cup', 'tbsp', 'tsp'];

export function MealSheet({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const s = useStore();
  const found = findItem(s, itemId);
  const [mode, setMode] = useState<null | 'move' | 'copy' | 'swap' | 'share'>(null);
  const canShare = useCanShare();
  if (!found) return null;
  const { date, slot, item } = found;
  const recipe = item.recipeId ? s.recipes[item.recipeId] : undefined;
  const ings = itemIngredients(item, s.recipes);
  const mac = round(itemMacros(item, s.recipes, s.foods));
  const logged = s.logs.find((l) => l.planItemId === item.id);
  const fav = !!item.recipeId && s.favorites.includes(item.recipeId);
  const est = itemIsEstimate(item, s.recipes, s.foods);

  const mutate = (fn: (it: PlanItem) => void) => {
    s.set((st) => {
      const f = findItem(st, itemId);
      if (f) fn(f.item);
    });
    s.syncLog(itemId);
  };
  const setIng = (idx: number, patch: Partial<Ingredient>) => mutate((it) => {
    const base = (it.ingredients ?? s.recipes[it.recipeId ?? '']?.ingredients ?? []).map((x) => ({ ...x }));
    const cur = base[idx];
    if (!cur) return;
    if (patch.amount != null) cur.amount = patch.amount / it.servings;
    if (patch.unit) {
      // convert the amount so the portion stays the same weight
      const food = s.foods[cur.foodId];
      const g = gramsOf(food, cur.amount, cur.unit);
      const per = gramsOf(food, 1, patch.unit) || 1;
      cur.unit = patch.unit;
      cur.amount = +(g / per).toFixed(2);
    }
    it.ingredients = base;
  });

  return (
    <Sheet open onClose={onClose} title={itemName(item, s.recipes)}
      footer={
        <div className="flex gap-2">
          {logged
            ? <button className="btn-ghost flex-1" onClick={() => { s.unlogItem(item.id); toast('Removed from log'); }}>Unlog</button>
            : <button className="btn-primary flex-1" onClick={() => { s.logItem(date, slot, item.id); toast('Logged as planned ♡'); }}>Log as eaten</button>}
          <button className="btn-soft flex-1" onClick={() => setMode('swap')}><ArrowLeftRight size={16} />Swap</button>
        </div>
      }>
      <div className="text-muted text-[14px] -mt-1 mb-4">{SLOT_LABEL[slot]} · {fmtDow(date)} {fmtShort(date)}</div>
      <div className="flex items-center gap-4 mb-4">
        <FoodArt art={recipe?.art ?? 'custom'} size={72} />
        <div className="grid grid-cols-2 gap-x-5 gap-y-1 flex-1">
          <Stat label="Calories" value={`${mac.cal}`} />
          <Stat label="Protein" value={`${mac.protein} g`} />
          <Stat label="Carbs" value={`${mac.carbs} g`} />
          <Stat label="Fat" value={`${mac.fat} g`} />
        </div>
      </div>
      {est && <div className="text-[13px] rounded-2xl bg-petal px-3 py-2 mb-4 text-ink">Estimates from generic nutrition data. Edit any food from its package label in Settings → Food library.</div>}

      <div className="card p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="font-medium">Portion</div>
          <div className="text-[13px] text-muted">{recipe?.servingLabel ?? '1 serving'}{fmtServ(item.servings)}</div>
        </div>
        <Stepper value={item.servings} onChange={(v) => mutate((it) => { it.servings = v; })} format={(v) => `${fmtAmount(v)}×`} />
      </div>

      {!item.quick && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="h-serif text-[16px]">Ingredients</h3>
            {item.ingredients && (
              <button className="text-[13px] text-deep font-medium inline-flex items-center gap-1" onClick={() => mutate((it) => { delete it.ingredients; })}><RotateCcw size={14} />Reset</button>
            )}
          </div>
          <div className="space-y-2 mb-3">
            {ings.map((ing, i) => {
              const food = s.foods[ing.foodId];
              if (!food) return null;
              const m = ingredientMacros(s.foods, { ...ing, amount: ing.amount * item.servings });
              const units = unitsFor(food);
              return (
                <div key={i} className="rounded-2xl border border-line bg-card p-3">
                  <div className="flex justify-between gap-2">
                    <div className="text-[14px] font-medium">{food.name}{food.state && ['cooked', 'raw', 'dry'].includes(food.state) && <span className="ml-1.5 text-[12px] uppercase tracking-wider text-deep bg-petal rounded-full px-2 py-0.5">{food.state}</span>}</div>
                    <div className="text-[13px] text-muted tabular-nums whitespace-nowrap">{Math.round(m.cal)} cal · {Math.round(m.protein)} g</div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="w-28"><NumberInput ariaLabel={`${food.name} amount`} value={+(ing.amount * item.servings).toFixed(2)} onChange={(v) => v != null && v >= 0 && setIng(i, { amount: v })} /></div>
                    <select aria-label={`${food.name} unit`} className="field flex-1" value={ing.unit} onChange={(e) => setIng(i, { unit: e.target.value as Unit })}>
                      {UNIT_OPTS.filter((u) => units.includes(u)).map((u) => <option key={u} value={u}>{u === 'each' ? (food.eachLabel ?? 'each') : u}</option>)}
                    </select>
                  </div>
                  {food.note && <div className="text-[13px] text-muted mt-1.5">{food.note}</div>}
                </div>
              );
            })}
          </div>
          {item.ingredients && recipe && (
            <button className="btn-ghost btn-sm w-full mb-4" onClick={() => {
              s.set((st) => { st.recipes[recipe.id].ingredients = (item.ingredients ?? []).map((x) => ({ ...x })); });
              mutate((it) => { delete it.ingredients; });
              toast('Saved as the recipe’s new default');
            }}><Save size={16} />Save these amounts as the recipe default</button>
          )}
        </>
      )}

      {recipe && (
        <>
          <h3 className="h-serif text-[16px] mb-2">How to make it</h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-[14px] mb-2">{recipe.instructions.map((t, i) => <li key={i}>{t}</li>)}</ol>
          {recipe.note && <p className="text-[13px] text-muted mb-2">{recipe.note}</p>}
        </>
      )}

      <div className="grid grid-cols-2 gap-2 mt-5">
        {item.recipeId && (
          <button className={`btn-ghost btn-sm ${fav ? 'text-deep' : ''}`} onClick={() => s.set((st) => {
            st.favorites = fav ? st.favorites.filter((x) => x !== item.recipeId) : [...st.favorites, item.recipeId!];
          })}><Heart size={16} fill={fav ? 'currentColor' : 'none'} />{fav ? 'Favorited' : 'Favorite'}</button>
        )}
        {recipe && <button className="btn-ghost btn-sm" onClick={() => canShare() && setMode('share')}><Share2 size={16} />Share recipe</button>}
        <button className="btn-ghost btn-sm" onClick={() => setMode('move')}><MoveRight size={16} />Move</button>
        <button className="btn-ghost btn-sm" onClick={() => setMode('copy')}><Copy size={16} />Copy to days</button>
        <button className="btn-ghost btn-sm text-deep" onClick={() => {
          s.set((st) => { const d = st.plans[date]; d[slot] = d[slot].filter((x) => x.id !== itemId); st.logs = st.logs.filter((l) => l.planItemId !== itemId); });
          toast('Removed from plan'); onClose();
        }}><Trash2 size={16} />Remove</button>
      </div>

      {mode === 'share' && recipe && <ShareRecipeSheet recipe={recipe} onClose={() => setMode(null)} />}
      {mode === 'swap' && <SwapSheet date={date} slot={slot} itemId={itemId} onClose={() => setMode(null)} />}
      {(mode === 'move' || mode === 'copy') && (
        <DayPicker multi={mode === 'copy'} from={date} title={mode === 'move' ? 'Move to which day?' : 'Copy to which days?'}
          onClose={() => setMode(null)}
          onPick={(days) => {
            s.set((st) => {
              const src = findItem(st, itemId);
              if (!src) return;
              for (const d of days) {
                st.plans[d] ??= emptyDay();
                st.plans[d][slot].push({ ...JSON.parse(JSON.stringify(src.item)), id: mode === 'move' ? src.item.id : uid() });
              }
              if (mode === 'move') st.plans[date][slot] = st.plans[date][slot].filter((x) => x !== src.item);
            });
            if (mode === 'move') s.syncLog(itemId);
            toast(mode === 'move' ? `Moved to ${fmtDow(days[0])}` : `Copied to ${days.length} day${days.length > 1 ? 's' : ''}`);
            setMode(null);
            if (mode === 'move') onClose();
          }} />
      )}
    </Sheet>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div><div className="text-[13px] text-muted">{label}</div><div className="font-semibold text-[15px] tabular-nums">{value}</div></div>
);

export function DayPicker({ multi, from, title, onPick, onClose }: { multi: boolean; from: string; title: string; onPick: (d: string[]) => void; onClose: () => void }) {
  const ws = weekStart(from);
  const days = [...weekDays(ws), ...weekDays(addDays(ws, 7))].filter((d) => d !== from);
  const [sel, setSel] = useState<string[]>([]);
  return (
    <Sheet open onClose={onClose} title={title} footer={multi ? <button className="btn-primary w-full" disabled={!sel.length} onClick={() => onPick(sel)}>Copy to {sel.length || ''} day{sel.length === 1 ? '' : 's'}</button> : undefined}>
      <div className="grid grid-cols-4 gap-2">
        {days.map((d) => (
          <button key={d} className={`rounded-2xl border px-2 py-3 text-center ${sel.includes(d) ? 'bg-deep text-white border-deep' : 'border-line bg-card'}`}
            onClick={() => multi ? setSel((x) => x.includes(d) ? x.filter((y) => y !== d) : [...x, d]) : onPick([d])}>
            <div className="text-[13px] opacity-80">{fmtDow(d)}</div>
            <div className="font-semibold">{fmtShort(d)}</div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function SwapSheet({ date, slot, itemId, onClose }: { date: string; slot: Slot; itemId?: string; onClose: () => void }) {
  const s = useStore();
  const [allSlots, setAllSlots] = useState(false);
  const [allDiets, setAllDiets] = useState(false);
  const list = Object.values(s.recipes)
    .filter((r) => allSlots || r.slot === slot)
    .filter((r) => allDiets || conflicts(r, s.foods, s.settings.diets).length === 0)
    .sort((a, b) => Number(s.favorites.includes(b.id)) - Number(s.favorites.includes(a.id)) || a.name.localeCompare(b.name));
  const current = itemId ? findItem(s, itemId)?.item.recipeId : undefined;
  return (
    <Sheet open onClose={onClose} title={itemId ? 'Swap this meal' : `Add to ${SLOT_LABEL[slot].toLowerCase()}`}>
      <label className="flex items-center gap-2 mb-3 text-[14px] text-muted">
        <input type="checkbox" checked={allSlots} onChange={(e) => setAllSlots(e.target.checked)} className="w-5 h-5 accent-[var(--rose-deep)]" />Show recipes from every meal type
      </label>
      {s.settings.diets.length > 0 && (
        <label className="flex items-center gap-2 mb-3 text-[14px] text-muted">
          <input type="checkbox" checked={allDiets} onChange={(e) => setAllDiets(e.target.checked)} className="w-5 h-5 accent-[var(--rose-deep)]" />Include recipes that don’t fit my diet
        </label>
      )}
      <div className="space-y-2">
        {list.map((r) => {
          const m = round(recipeMacros(s.foods, r));
          return (
            <button key={r.id} disabled={r.id === current} className={`w-full card p-3 flex items-center gap-3 text-left ${r.id === current ? 'opacity-60' : ''}`}
              onClick={() => {
                s.set((st) => {
                  st.plans[date] ??= emptyDay();
                  if (itemId) {
                    const f = findItem(st, itemId);
                    if (f) { f.item.recipeId = r.id; delete f.item.ingredients; delete f.item.quick; f.item.servings = 1; }
                  } else st.plans[date][slot].push({ id: uid(), recipeId: r.id, servings: 1 });
                });
                if (itemId) s.syncLog(itemId);
                toast(itemId ? `Swapped to ${r.name}` : `Added ${r.name}`);
                onClose();
              }}>
              <FoodArt art={r.art} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{r.name}{s.favorites.includes(r.id) && <span className="text-rose"> ♥</span>}</div>
                <div className="text-[13px] text-muted">{r.servingLabel} · ≈ {m.cal} cal · {m.protein} g protein</div>
                <div className="flex flex-wrap gap-1 mt-1">{dietBadges(r, s.foods).map((b) => <span key={b} className="text-[11px] rounded-full bg-petal text-deep px-2 py-0.5">{b}</span>)}</div>
              </div>
              {r.id === current && <span className="text-[13px] text-muted">Current</span>}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

/** Log foods that aren't in the plan: quick add, from food library, or from a recipe */
export function LogFoodSheet({ date, onClose, defaultSlot = 'snack' }: { date: string; onClose: () => void; defaultSlot?: Slot }) {
  const s = useStore();
  const [tab, setTab] = useState<'food' | 'recipe' | 'quick'>('food');
  const [slot, setSlot] = useState<Slot>(defaultSlot);
  const [q, setQ] = useState('');
  const [foodId, setFoodId] = useState<string | null>(null);
  const [amt, setAmt] = useState<number | null>(1);
  const [unit, setUnit] = useState<Unit>('g');
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [serv, setServ] = useState(1);
  const [quick, setQuick] = useState({ name: '', cal: null as number | null, protein: null as number | null, carbs: null as number | null, fat: null as number | null });

  const foods = useMemo(() => Object.values(s.foods).filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)), [s.foods, q]);
  const food = foodId ? s.foods[foodId] : null;
  const foodMac = food && amt ? round(macrosForGrams(food, gramsOf(food, amt, unit))) : null;
  const recipe = recipeId ? s.recipes[recipeId] : null;
  const recMac = recipe ? round(itemMacros({ id: 'x', recipeId: recipe.id, servings: serv }, s.recipes, s.foods)) : null;

  const submit = () => {
    if (tab === 'food' && food && foodMac) s.addLog({ date, slot, name: `${food.name} — ${fmtAmount(amt!)} ${unit === 'each' ? food.eachLabel ?? '' : unit}`.trim(), ...foodMac });
    else if (tab === 'recipe' && recipe && recMac) s.addLog({ date, slot, name: `${recipe.name}${fmtServ(serv)}`, ...recMac });
    else if (tab === 'quick' && quick.name && quick.cal != null) s.addLog({ date, slot, name: quick.name, cal: Math.round(quick.cal), protein: Math.round(quick.protein ?? 0), carbs: Math.round(quick.carbs ?? 0), fat: Math.round(quick.fat ?? 0) });
    else return;
    toast('Added to today’s log ♡');
    onClose();
  };
  const can = (tab === 'food' && !!foodMac) || (tab === 'recipe' && !!recMac) || (tab === 'quick' && !!quick.name && quick.cal != null);

  return (
    <Sheet open onClose={onClose} title="Log something extra" footer={<button className="btn-primary w-full" disabled={!can} onClick={submit}><Plus size={18} />Add to log</button>}>
      <div className="mb-3"><Segmented value={tab} onChange={setTab} options={[{ value: 'food', label: 'Foods' }, { value: 'recipe', label: 'Recipes' }, { value: 'quick', label: 'Quick add' }]} /></div>
      <Field label="Meal">
        <select className="field" value={slot} onChange={(e) => setSlot(e.target.value as Slot)}>{SLOTS.map((x) => <option key={x} value={x}>{SLOT_LABEL[x]}</option>)}</select>
      </Field>
      {tab === 'food' && (
        <>
          <div className="relative mb-2">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input className="field pl-11" placeholder="Search foods" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-2xl border border-line bg-card mb-3">
            {foods.map((f) => (
              <button key={f.id} className={`w-full text-left px-4 py-3 border-b border-line last:border-0 ${foodId === f.id ? 'bg-petal' : ''}`}
                onClick={() => { setFoodId(f.id); const u = unitsFor(f)[0]; setUnit(u); setAmt(u === 'each' ? 1 : u === 'g' ? 100 : 1); }}>
                <div className="text-[14px]">{f.name}{f.state ? <span className="text-muted"> · {f.state}</span> : null}</div>
                <div className="text-[13px] text-muted">{f.per100g.cal} cal / 100 g{f.estimate ? ' · estimate' : ' · from label'}</div>
              </button>
            ))}
          </div>
          {food && (
            <div className="flex gap-2 items-end">
              <div className="w-28"><span className="label">Amount</span><NumberInput value={amt} onChange={setAmt} ariaLabel="Amount" /></div>
              <div className="flex-1"><span className="label">Unit</span>
                <select className="field" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>{unitsFor(food).map((u) => <option key={u} value={u}>{u === 'each' ? food.eachLabel ?? 'each' : u}</option>)}</select>
              </div>
            </div>
          )}
          {foodMac && <div className="mt-3 text-[14px]"><b>{foodMac.cal} cal</b> · {foodMac.protein} g protein</div>}
        </>
      )}
      {tab === 'recipe' && (
        <>
          <div className="max-h-64 overflow-y-auto rounded-2xl border border-line bg-card mb-3">
            {Object.values(s.recipes).map((r) => (
              <button key={r.id} className={`w-full text-left px-4 py-3 border-b border-line last:border-0 ${recipeId === r.id ? 'bg-petal' : ''}`} onClick={() => setRecipeId(r.id)}>
                <div className="text-[14px]">{r.name}</div><div className="text-[13px] text-muted">{SLOT_LABEL[r.slot]}</div>
              </button>
            ))}
          </div>
          {recipe && <div className="flex items-center justify-between"><Stepper value={serv} onChange={setServ} format={(v) => `${fmtAmount(v)}×`} /><div className="text-[14px]"><b>{recMac!.cal} cal</b> · {recMac!.protein} g</div></div>}
        </>
      )}
      {tab === 'quick' && (
        <>
          <Field label="What did you have?"><input className="field" value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} placeholder="e.g. Latte" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories"><NumberInput value={quick.cal} onChange={(v) => setQuick({ ...quick, cal: v })} /></Field>
            <Field label="Protein (g)"><NumberInput value={quick.protein} onChange={(v) => setQuick({ ...quick, protein: v })} /></Field>
            <Field label="Carbs (g, optional)"><NumberInput value={quick.carbs} onChange={(v) => setQuick({ ...quick, carbs: v })} /></Field>
            <Field label="Fat (g, optional)"><NumberInput value={quick.fat} onChange={(v) => setQuick({ ...quick, fat: v })} /></Field>
          </div>
        </>
      )}
    </Sheet>
  );
}
