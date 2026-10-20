import { useState } from 'react';
import { Clock, Plus, RefreshCcw, Share2, ShieldCheck, ShoppingBasket, Sparkles, Undo2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { GROCERY_CATEGORIES } from '../lib/types';
import type { GroceryCategory, GroceryItem } from '../lib/types';
import { addDays, fmtLong, fmtShort, uid, weekDays, weekStart, weekday } from '../lib/date';
import { useToday } from '../lib/derived';
import { groceryText } from '../lib/grocery';
import { FOOD_SAFETY } from '../lib/seed';
import { Bar, Card, CheckCircle, Empty, Field, Header, NumberInput, Segmented, Sheet, toast } from '../components/ui';
import { useUI } from '../lib/ui';

export default function Groceries() {
  const sub = (useUI((u) => u.sub.groceries) ?? 'list') as 'list' | 'prep';
  const setSub = useUI((u) => u.setSub);
  return (
    <div>
      <Header eyebrow="Shop once, eat well" title="Groceries" />
      <div className="mb-5"><Segmented value={sub} onChange={(v) => setSub('groceries', v)} options={[{ value: 'list', label: 'Shopping list' }, { value: 'prep', label: 'Meal prep' }]} /></div>
      {sub === 'list' ? <GroceryList /> : <MealPrep />}
    </div>
  );
}

function GroceryList() {
  const s = useStore();
  const today = useToday();
  const [edit, setEdit] = useState<GroceryItem | 'new' | null>(null);
  const [gen, setGen] = useState(false);
  const [hideDone, setHideDone] = useState(false);
  const items = s.groceries;
  const done = items.filter((i) => i.checked).length;
  const total = items.reduce((a, i) => a + (i.price ?? 0), 0);

  const share = async () => {
    const text = groceryText(items, GROCERY_CATEGORIES);
    try {
      if (navigator.share) { await navigator.share({ title: 'Grocery list', text }); return; }
    } catch { /* cancelled */ return; }
    try { await navigator.clipboard.writeText(text); toast('List copied'); } catch { toast('Couldn’t copy on this device'); }
  };

  const ranges = [
    { label: 'This week', days: weekDays(weekStart(today)) },
    { label: 'Rest of this week', days: weekDays(weekStart(today)).filter((d) => d >= today) },
    { label: 'Next week', days: weekDays(addDays(weekStart(today), 7)) },
    { label: 'Mon–Wed (Sunday prep)', days: weekDays(addDays(weekStart(today), weekday(today) === 0 ? 7 : 0)).slice(0, 3) },
    { label: 'Thu–Sun (Wednesday prep)', days: weekDays(weekStart(today)).slice(3) }
  ];

  return (
    <>
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div><div className="font-semibold">{done} of {items.length} in the basket</div>{total > 0 && <div className="text-[14px] text-muted">Estimated ${total.toFixed(2)}</div>}</div>
          <ShoppingBasket className="text-rose" />
        </div>
        <Bar pct={items.length ? (done / items.length) * 100 : 0} color="var(--sage)" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button className="btn-primary btn-sm" onClick={() => setGen(true)}><Sparkles size={16} />From meal plan</button>
          <button className="btn-soft btn-sm" onClick={() => setEdit('new')}><Plus size={16} />Add item</button>
          <button className="btn-soft btn-sm" onClick={share}><Share2 size={16} />Share / copy</button>
          <button className="btn-soft btn-sm" onClick={() => { s.set((st) => { st.groceries.forEach((g) => { g.checked = false; }); }); toast('Checklist reset'); }}><Undo2 size={16} />Reset checks</button>
        </div>
        <label className="flex items-center gap-2 mt-3 text-[15px] text-muted"><input type="checkbox" className="w-5 h-5 accent-[var(--rose-deep)]" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />Hide items in the basket</label>
      </Card>

      {items.length === 0 && <Empty icon={<ShoppingBasket />} title="Your list is empty" sub="Generate it from your meal plan, or add items yourself." />}
      {GROCERY_CATEGORIES.map((c) => {
        const list = items.filter((i) => i.category === c && (!hideDone || !i.checked));
        if (!list.length) return null;
        return (
          <div key={c} className="mb-4">
            <h3 className="eyebrow mb-2 px-1">{c}</h3>
            <div className="card divide-y divide-line !rounded-2xl">
              {list.map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-4 py-3">
                  <CheckCircle on={i.checked} label={i.name} onToggle={() => s.set((st) => { const g = st.groceries.find((x) => x.id === i.id); if (g) g.checked = !g.checked; })} />
                  <button className="flex-1 text-left min-w-0" onClick={() => setEdit(i)}>
                    <div className={`text-[16px] ${i.checked ? 'line-through text-muted decoration-blush' : ''}`}>{i.name}</div>
                    <div className="text-[14px] text-muted">{i.qty != null ? `${i.qty} ${i.unit}` : 'As needed'}{i.price ? ` · $${i.price.toFixed(2)}` : ''}{i.source === 'plan' ? ' · from plan' : ''}</div>
                  </button>
                  <button className="text-[14px] text-deep font-medium px-2 min-h-[40px]" onClick={() => setEdit(i)}>Edit</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {s.owned.length > 0 && (
        <Card className="mt-2">
          <div className="font-medium mb-1">Pantry items you already have</div>
          <p className="text-[14px] text-muted mb-2">These are left off generated lists. Tap to include again.</p>
          <div className="flex flex-wrap gap-2">
            {s.owned.map((k) => {
              const f = Object.values(s.foods).find((x) => x.grocery.key === k);
              return <button key={k} className="chip" onClick={() => s.set((st) => { st.owned = st.owned.filter((x) => x !== k); })}>{f?.grocery.name ?? k} ✕</button>;
            })}
          </div>
        </Card>
      )}

      {gen && (
        <Sheet open onClose={() => setGen(false)} title="Build from my meal plan">
          <p className="text-muted text-[15px] mb-4">Combines matching ingredients and converts cooked amounts to what to buy raw. Your custom items and checks are kept.</p>
          {ranges.map((r) => (
            <button key={r.label} className="w-full card p-4 mb-2 text-left flex items-center justify-between" onClick={() => {
              r.days.forEach((d) => s.ensureWeek(weekStart(d)));
              s.generateGroceries(r.days);
              toast('Grocery list updated from your plan');
              setGen(false);
            }}>
              <span><span className="font-medium block">{r.label}</span><span className="text-[14px] text-muted">{fmtShort(r.days[0])} – {fmtShort(r.days[r.days.length - 1])}</span></span>
              <RefreshCcw size={18} className="text-deep" />
            </button>
          ))}
          <button className="btn-ghost w-full mt-2" onClick={() => { s.set((st) => { st.groceries = st.groceries.filter((g) => g.source === 'custom' ? false : true); }); toast('Removed your manually added items'); setGen(false); }}>Remove all manually added items</button>
        </Sheet>
      )}
      {edit && <GroceryEditor item={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function GroceryEditor({ item, onClose }: { item: GroceryItem | null; onClose: () => void }) {
  const s = useStore();
  const [g, setG] = useState<GroceryItem>(item ?? { id: uid(), name: '', qty: 1, unit: '', category: 'Pantry', checked: false, source: 'custom', price: null });
  const save = () => {
    if (!g.name.trim()) return;
    s.set((st) => {
      const i = st.groceries.findIndex((x) => x.id === g.id);
      if (i >= 0) st.groceries[i] = { ...g, name: g.name.trim() }; else st.groceries.push({ ...g, name: g.name.trim() });
    });
    toast(item ? 'Item updated' : 'Item added'); onClose();
  };
  return (
    <Sheet open onClose={onClose} title={item ? 'Edit item' : 'Add an item'} footer={<div className="flex gap-2">
      {item && <button className="btn-ghost flex-1" onClick={() => { s.set((st) => { st.groceries = st.groceries.filter((x) => x.id !== g.id); }); toast('Item deleted'); onClose(); }}>Delete</button>}
      <button className="btn-primary flex-[2]" disabled={!g.name.trim()} onClick={save}>Save</button></div>}>
      <Field label="Item"><input className="field" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} placeholder="e.g. Bananas" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity"><NumberInput value={g.qty} onChange={(v) => setG({ ...g, qty: v })} /></Field>
        <Field label="Unit"><input className="field" value={g.unit} onChange={(e) => setG({ ...g, unit: e.target.value })} placeholder="lb, bag, jar…" /></Field>
        <Field label="Category"><select className="field" value={g.category} onChange={(e) => setG({ ...g, category: e.target.value as GroceryCategory })}>{GROCERY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Price (optional)"><NumberInput value={g.price ?? null} onChange={(v) => setG({ ...g, price: v })} placeholder="$" /></Field>
      </div>
      {item?.source === 'plan' && item.key && (
        <button className="btn-soft w-full" onClick={() => {
          s.set((st) => { if (!st.owned.includes(item.key!)) st.owned.push(item.key!); st.groceries = st.groceries.filter((x) => x.id !== item.id); });
          toast('Left off future lists'); onClose();
        }}>I already have this — leave it off generated lists</button>
      )}
    </Sheet>
  );
}

function MealPrep() {
  const s = useStore();
  const today = useToday();
  const wd = weekday(today);
  const [which, setWhich] = useState<'sunday' | 'wednesday'>(wd === 0 || wd >= 4 ? 'sunday' : 'wednesday');
  // the prep day this checklist belongs to: the upcoming (or today's) Sunday/Wednesday
  const target = which === 'sunday' ? 0 : 3;
  const delta = (target - wd + 7) % 7;
  const prepDate = addDays(today, delta);
  const tasks = s.prepTasks[which];
  const checks = s.prepChecks[`${which}:${prepDate}`] ?? [];
  const mins = tasks.reduce((a, t) => a + t.minutes, 0);
  const left = tasks.filter((t) => !checks.includes(t.id)).reduce((a, t) => a + t.minutes, 0);

  const toggle = (id: string) => s.set((st) => {
    const k = `${which}:${prepDate}`;
    const cur = st.prepChecks[k] ?? [];
    st.prepChecks[k] = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  });

  return (
    <div className="space-y-4">
      <Segmented value={which} onChange={setWhich} options={[{ value: 'sunday', label: 'Sunday prep' }, { value: 'wednesday', label: 'Wednesday prep' }]} />
      <Card>
        <div className="eyebrow">{which === 'sunday' ? 'Meals for Monday–Wednesday' : 'Meals for Thursday–Sunday'}</div>
        <div className="h-serif text-[26px] mt-1">{fmtLong(prepDate)}</div>
        <div className="text-[14px] text-muted mb-3 flex items-center gap-1.5"><Clock size={14} />About {mins} min total{left && left < mins ? ` · ${left} min left` : ''} — some steps overlap</div>
        <Bar pct={(checks.length / tasks.length) * 100} color="var(--sage)" />
        <div className="text-[14px] text-muted mt-1.5">{checks.length} of {tasks.length} steps done{checks.length === tasks.length ? ' — your week is ready ♡' : ''}</div>
      </Card>
      <div className="space-y-3">
        {tasks.map((t, i) => {
          const on = checks.includes(t.id);
          return (
            <div key={t.id} className={`card p-4 ${on ? 'opacity-75' : ''}`}>
              <div className="flex items-start gap-3">
                <CheckCircle on={on} onToggle={() => toggle(t.id)} label={t.title} />
                <div className="flex-1 min-w-0" onClick={() => toggle(t.id)}>
                  <div className="flex justify-between gap-2"><div className={`font-medium ${on ? 'line-through decoration-blush' : ''}`}>{i + 1}. {t.title}</div><span className="text-[13px] text-muted whitespace-nowrap">{t.minutes} min</span></div>
                  <p className="text-[15px] mt-1">{t.instructions}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">{t.ingredients.map((x) => <span key={x} className="text-[13px] rounded-full bg-petal px-2.5 py-1">{x}</span>)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Card className="bg-petal border-blush">
        <div className="flex items-center gap-2 font-semibold mb-2"><ShieldCheck size={18} className="text-deep" />Food safety & storage</div>
        <ul className="space-y-1.5 text-[15px] list-disc pl-5">{FOOD_SAFETY.map((x) => <li key={x}>{x}</li>)}</ul>
      </Card>
    </div>
  );
}
