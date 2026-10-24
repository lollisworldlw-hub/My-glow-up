import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Heart, Plus, Share2, Shuffle, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useStore, emptyDay } from '../lib/store';
import { SLOT_LABEL, SLOTS } from '../lib/types';
import type { Slot } from '../lib/types';
import { addDays, fmtDow, fmtShort, uid, weekDays, weekStart, fromKey } from '../lib/date';
import { consumed, planned, useToday } from '../lib/derived';
import { recipeMacros, round } from '../lib/nutrition';
import { Card, Header, Segmented, Sheet, toast } from '../components/ui';
import { LogFoodSheet, MealCard, SwapSheet } from '../components/MealParts';
import { RecipeEditor } from '../components/RecipeEditor';
import Groceries from './Groceries';
import { FoodArt } from '../components/Art';
import { useUI } from '../lib/ui';
import { FoodPhotos, ShareRecipeSheet, useCanShare } from '../components/ShareParts';
import { conflicts, dietBadges } from '../lib/diet';

export default function Meals() {
  const sub = (useUI((u) => u.sub.meals) ?? 'week') as 'week' | 'desserts' | 'recipes' | 'groceries';
  const setSub = useUI((u) => u.setSub);
  return (
    <div>
      <Header eyebrow="Simple & repeatable" title="Meals" />
      <div className="mb-3"><Segmented value={sub} onChange={(v) => setSub('meals', v)} options={[{ value: 'week', label: 'Week plan' }, { value: 'recipes', label: 'Recipes' }, { value: 'desserts', label: 'Desserts' }, { value: 'groceries', label: 'Groceries' }]} /></div>
      {sub === 'week' && <WeekPlan />}
      {sub === 'desserts' && <Desserts />}
      {sub === 'recipes' && <Recipes />}
      {sub === 'groceries' && <Groceries embedded />}
    </div>
  );
}

function WeekPlan() {
  const s = useStore();
  const today = useToday();
  const [monday, setMonday] = useState(weekStart(today));
  const [day, setDay] = useState(today);
  const [add, setAdd] = useState<Slot | null>(null);
  const [log, setLog] = useState(false);
  const [tools, setTools] = useState(false);
  useEffect(() => { s.ensureWeek(monday); }, [monday]);
  const days = weekDays(monday);
  const plan = s.plans[day];
  const p = round(planned(s, day));
  const c = round(consumed(s, day));
  const extras = s.logs.filter((l) => l.date === day && !l.planItemId);

  const shift = (n: number) => { const m = addDays(monday, n * 7); setMonday(m); setDay(n === 0 ? today : m); };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button aria-label="Previous week" className="w-10 h-10 rounded-full bg-petal grid place-items-center text-deep" onClick={() => shift(-1)}><ChevronLeft size={20} /></button>
        <div className="text-center">
          <div className="font-semibold">{fmtShort(monday)} – {fmtShort(addDays(monday, 6))}</div>
          {monday !== weekStart(today) && <button className="text-[13px] text-deep" onClick={() => { setMonday(weekStart(today)); setDay(today); }}>Back to this week</button>}
        </div>
        <button aria-label="Next week" className="w-10 h-10 rounded-full bg-petal grid place-items-center text-deep" onClick={() => shift(1)}><ChevronRight size={20} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {days.map((d) => {
          const cal = Math.round(planned(s, d).cal);
          return (
            <button key={d} onClick={() => setDay(d)} aria-pressed={d === day}
              className={`rounded-2xl py-2 text-center border transition ${d === day ? 'bg-deep text-white border-deep' : d === today ? 'border-rose bg-card' : 'border-line bg-card'}`}>
              <div className="text-[12px] opacity-80">{fmtDow(d).slice(0, 3)}</div>
              <div className="font-semibold text-[14px]">{fromKey(d).getDate()}</div>
              <div className={`text-[11px] tabular-nums ${d === day ? 'opacity-90' : 'text-muted'}`}>{cal || '—'}</div>
            </button>
          );
        })}
      </div>

      <Card className="mb-3 !p-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[13px] text-muted">{fmtDow(day)} plan</div>
            <div className="font-semibold text-[14px]">≈ {p.cal} cal · {p.protein} g protein</div>
            <div className="text-[13px] text-muted">Logged {c.cal} cal · {c.protein} g · target {s.settings.calTarget}</div>
          </div>
          <button className="btn-soft btn-sm" onClick={() => setTools(true)}><Wand2 size={16} />Plan</button>
        </div>
      </Card>

      <div className="space-y-5">
        {SLOTS.map((slot) => (
          <div key={slot}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="h-serif text-[15px]">{SLOT_LABEL[slot]}</h3>
              <button className="text-deep text-[14px] font-medium inline-flex items-center gap-1 min-h-[40px]" onClick={() => setAdd(slot)}><Plus size={16} />Add</button>
            </div>
            <div className="space-y-2">
              {(plan?.[slot] ?? []).map((it) => <MealCard key={it.id} date={day} slot={slot} item={it} compact />)}
              {!(plan?.[slot] ?? []).length && <div className="rounded-2xl border border-dashed border-blush p-3 text-[14px] text-muted text-center">Nothing planned</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-3 mt-3">
        <div className="flex items-center justify-between"><div className="font-medium">Extra foods logged</div><button className="btn-soft btn-sm" onClick={() => setLog(true)}><Plus size={16} />Log food</button></div>
        {extras.map((l) => (
          <div key={l.id} className="flex items-center py-2 border-b border-line last:border-0">
            <div className="flex-1"><div className="text-[14px]">{l.name}</div><div className="text-[13px] text-muted">{SLOT_LABEL[l.slot]} · {l.cal} cal · {l.protein} g</div></div>
            <button aria-label="Delete" className="w-10 h-10 grid place-items-center text-muted" onClick={() => s.set((x) => { x.logs = x.logs.filter((y) => y.id !== l.id); })}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <div className="mt-3"><FoodPhotos date={day} /></div>
      {add && <SwapSheet date={day} slot={add} onClose={() => setAdd(null)} />}
      {log && <LogFoodSheet date={day} onClose={() => setLog(false)} />}
      {tools && (
        <Sheet open onClose={() => setTools(false)} title="Plan this week">
          <p className="text-muted text-[14px] mb-3">These replace the meals for {fmtShort(monday)} – {fmtShort(addDays(monday, 6))}. Logged food stays in your log.</p>
          {[
            { mode: 'copy-prev' as const, icon: <Copy size={18} />, t: 'Copy last week', d: 'Repeat everything from the week before.' },
            { mode: 'rotation' as const, icon: <Sparkles size={18} />, t: 'Use my rotation', d: 'The easy batch-prep rotation (chicken bowls Mon–Wed, turkey bowls Thu–Sun).' },
            { mode: 'favorites' as const, icon: <Shuffle size={18} />, t: 'Mix from my favorites', d: 'Builds a week from recipes you’ve hearted.' },
            { mode: 'clear' as const, icon: <Trash2 size={18} />, t: 'Clear the week', d: 'Start with a blank plan.' }
          ].map((o) => (
            <button key={o.mode} className="w-full card p-3 mb-2 flex items-start gap-2 text-left" onClick={() => { s.generateWeek(monday, o.mode); toast('Week updated'); setTools(false); }}>
              <span className="w-10 h-10 rounded-full bg-petal text-deep grid place-items-center shrink-0">{o.icon}</span>
              <span><span className="font-medium block">{o.t}</span><span className="text-[13px] text-muted">{o.d}</span></span>
            </button>
          ))}
          <button className="btn-ghost w-full mt-2" onClick={() => {
            s.set((st) => {
              const src = st.plans[day] ?? emptyDay();
              for (const d of weekDays(monday)) if (d !== day) st.plans[d] = Object.fromEntries(SLOTS.map((sl) => [sl, (src[sl] ?? []).map((x) => ({ ...JSON.parse(JSON.stringify(x)), id: uid() }))])) as any;
            });
            toast(`Copied ${fmtDow(day)} to the whole week`); setTools(false);
          }}><Copy size={16} />Copy {fmtDow(day)} to every day this week</button>
          <button className="btn-ghost w-full mt-2" onClick={() => {
            s.set((st) => {
              for (const d of weekDays(monday)) {
                const p = st.plans[d]; if (!p) continue;
                const wd = new Date(d + 'T12:00').getDay();
                st.rotation[wd] = Object.fromEntries(SLOTS.filter((sl) => p[sl]?.[0]?.recipeId).map((sl) => [sl, p[sl][0].recipeId!]));
              }
            });
            toast('Saved as your rotation for future weeks'); setTools(false);
          }}><Sparkles size={16} />Use this week as my rotation</button>
        </Sheet>
      )}
    </>
  );
}

function Desserts() {
  const s = useStore();
  const today = useToday();
  const [edit, setEdit] = useState<string | null | 'new'>(null);
  const desserts = Object.values(s.recipes).filter((r) => r.slot === 'dessert' && conflicts(r, s.foods, s.settings.diets).length === 0)
    .sort((a, b) => Number(s.favorites.includes(b.id)) - Number(s.favorites.includes(a.id)));
  const tonight = s.plans[today]?.dessert ?? [];
  const [shareD, setShareD] = useState<string | null>(null);
  const canShare = useCanShare();

  const addTonight = (id: string, replace: boolean) => {
    s.set((st) => {
      st.plans[today] ??= emptyDay();
      if (replace && st.plans[today].dessert.length) {
        const it = st.plans[today].dessert[0];
        it.recipeId = id; delete it.ingredients; it.servings = 1;
      } else st.plans[today].dessert.push({ id: uid(), recipeId: id, servings: 1 });
    });
    const it = useStore.getState().plans[today].dessert[0];
    if (it) s.syncLog(it.id);
    toast(`${s.recipes[id].name} is tonight’s treat`);
  };

  return (
    <>
      <Card className="mb-3 bg-petal border-blush">
        <div className="eyebrow mb-2">Tonight’s dessert</div>
        {tonight.length ? tonight.map((it) => <div key={it.id} className="mb-2 last:mb-0"><MealCard date={today} slot="dessert" item={it} /></div>)
          : <p className="text-muted">Pick something sweet below — it’s part of the plan.</p>}
      </Card>
      <div className="grid grid-cols-2 gap-2">
        {desserts.map((r) => {
          const m = round(recipeMacros(s.foods, r));
          const fav = s.favorites.includes(r.id);
          return (
            <div key={r.id} className="card p-3 flex flex-col">
              <button className="text-left" onClick={() => setEdit(r.id)} aria-label={`Edit ${r.name}`}>
                <div className="relative"><div className="w-full aspect-[4/3] rounded-2xl bg-petal grid place-items-center"><FoodArt art={r.art} size={84} /></div></div>
                <div className="font-medium mt-2 leading-snug">{r.name}</div>
                <div className="text-[13px] text-muted">{r.servingLabel}</div>
                <div className="text-[13px] mt-1 tabular-nums">≈ {m.cal} cal · {m.protein} g</div>
              </button>
              <div className="flex gap-1.5 mt-auto pt-3">
                <button aria-label={fav ? 'Unfavorite' : 'Favorite'} className={`w-10 h-10 shrink-0 rounded-full grid place-items-center border border-line ${fav ? 'text-rose' : 'text-muted'}`}
                  onClick={() => s.set((st) => { st.favorites = fav ? st.favorites.filter((x) => x !== r.id) : [...st.favorites, r.id]; })}>
                  <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
                </button>
                <button aria-label={`Share ${r.name}`} className="w-10 h-10 shrink-0 rounded-full grid place-items-center border border-line text-muted" onClick={() => canShare() && setShareD(r.id)}><Share2 size={17} /></button>
                <button className="btn-primary btn-sm flex-1 !px-2 text-[13px]" onClick={() => addTonight(r.id, true)}>Tonight</button>
              </div>
            </div>
          );
        })}
        <button className="card p-3 grid place-items-center text-center border-dashed min-h-[220px]" onClick={() => setEdit('new')}>
          <div><div className="mx-auto w-12 h-12 rounded-full bg-petal text-deep grid place-items-center mb-2"><Plus /></div><div className="font-medium">Add a custom dessert</div></div>
        </button>
      </div>
      <p className="text-[13px] text-muted mt-3">Tap a dessert to adjust its portion or ingredients. “Tonight” swaps it into today’s plan.</p>
      {edit && <RecipeEditor recipeId={edit === 'new' ? undefined : edit} slot="dessert" onClose={() => setEdit(null)} />}
      {shareD && s.recipes[shareD] && <ShareRecipeSheet recipe={s.recipes[shareD]} onClose={() => setShareD(null)} />}
    </>
  );
}

function Recipes() {
  const s = useStore();
  const [edit, setEdit] = useState<string | null | 'new'>(null);
  const [share, setShare] = useState<string | null>(null);
  const canShare = useCanShare();
  return (
    <>
      <button className="btn-primary w-full mb-3" onClick={() => setEdit('new')}><Plus size={18} />New recipe</button>
      {SLOTS.map((slot) => {
        const list = Object.values(s.recipes).filter((r) => r.slot === slot);
        if (!list.length) return null;
        return (
          <div key={slot} className="mb-3">
            <h3 className="h-serif text-[15px] mb-2">{SLOT_LABEL[slot]}</h3>
            <div className="space-y-2">
              {list.map((r) => {
                const m = round(recipeMacros(s.foods, r));
                const fav = s.favorites.includes(r.id);
                return (
                  <div key={r.id} className="card p-3 flex items-center gap-2">
                    <button className="flex-1 min-w-0 flex items-center gap-2 text-left" onClick={() => setEdit(r.id)}>
                      <FoodArt art={r.art} size={48} />
                      <div className="min-w-0"><div className="font-medium">{r.name}</div><div className="text-[13px] text-muted">{r.servingLabel} · ≈ {m.cal} cal · {m.protein} g protein</div>
                        <div className="flex flex-wrap gap-1 mt-1">{dietBadges(r, s.foods).map((b) => <span key={b} className="text-[11px] rounded-full bg-petal text-deep px-2 py-0.5">{b}</span>)}{conflicts(r, s.foods, s.settings.diets).length > 0 && <span className="text-[11px] rounded-full border border-blush text-muted px-2 py-0.5">Doesn’t fit my diet</span>}</div></div>
                    </button>
                    <button aria-label={`Share ${r.name}`} className="w-10 h-10 rounded-full grid place-items-center text-muted" onClick={() => canShare() && setShare(r.id)}><Share2 size={18} /></button>
                    <button aria-label={fav ? 'Unfavorite' : 'Favorite'} className={`w-10 h-10 rounded-full grid place-items-center ${fav ? 'text-rose' : 'text-muted'}`}
                      onClick={() => s.set((st) => { st.favorites = fav ? st.favorites.filter((x) => x !== r.id) : [...st.favorites, r.id]; })}>
                      <Heart size={19} fill={fav ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {edit && <RecipeEditor recipeId={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      {share && s.recipes[share] && <ShareRecipeSheet recipe={s.recipes[share]} onClose={() => setShare(null)} />}
    </>
  );
}

