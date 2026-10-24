import { useEffect, useRef, useState } from 'react';
import { Bell, Database, Download, Heart, Moon, Plus, Search, Trash2, Upload, Utensils } from 'lucide-react';
import { useStore, initialState, stateOnly } from '../lib/store';
import type { Food, GroceryCategory, HomeWorkoutType, ScheduleDay } from '../lib/types';
import { GROCERY_CATEGORIES, SLOT_LABEL, DIETS, FOOD_TAGS } from '../lib/types';
import type { FoodTag } from '../lib/types';
import { QUOTE_STYLES } from '../lib/quotes';
import { weekStart, addDays as addD } from '../lib/date';
import { DOW_NAMES, todayKey, uid } from '../lib/date';
import { clearPhotos, downloadText, exportData, parseBackup, restorePhotos } from '../lib/backup';
import { kgToLb, latest, lbToKg } from '../lib/weight';
import { Card, Field, Header, NumberInput, SectionTitle, Segmented, Sheet, toast } from '../components/ui';
import { WeightSheet } from '../components/WeightSheet';
import { CloudCard } from '../components/CloudCard';
import { AdminCard } from '../components/AdminPanel';
import { JoinGroupCard } from '../components/Auth';
import { useSync } from '../lib/sync';
import { disablePush, enablePush, isIOS, isStandaloneApp, sendTest } from '../lib/push';

export default function Settings() {
  const s = useStore();
  const st = s.settings;
  const set = (patch: Partial<typeof st>) => s.set((x) => { Object.assign(x.settings, patch); });
  const [sheet, setSheet] = useState<null | 'weight' | 'foods' | 'schedule' | 'favorites' | 'delete' | 'reminders'>(null);
  const kg = st.weightUnit === 'kg';
  const wIn = (lbs: number) => (kg ? +lbToKg(lbs).toFixed(1) : lbs);
  const wOut = (v: number) => (kg ? +kgToLb(v).toFixed(1) : v);
  const [dislike, setDislike] = useState('');
  const cur = latest(s.weights)?.lbs;

  return (
    <div>
      <Header eyebrow="Make it yours" title="Settings" />
      <AdminCard />
      <div className="mt-2"><JoinGroupCard /></div>

      <SectionTitle>Me & my goals</SectionTitle>
      <Card>
        <Field label="Greeting name"><input className="field" value={st.name} onChange={(e) => set({ name: e.target.value })} placeholder="Your first name" /></Field>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label={`Starting weight (${kg ? 'kg' : 'lbs'})`}><NumberInput value={wIn(st.startWeight)} onChange={(v) => v && set({ startWeight: wOut(v) })} /></Field>
          <Field label={`Goal weight (${kg ? 'kg' : 'lbs'})`}><NumberInput value={wIn(st.goalWeight)} onChange={(v) => v && set({ goalWeight: wOut(v) })} /></Field>
          <Field label="Height (in)"><NumberInput value={st.heightIn} onChange={(v) => v && set({ heightIn: v })} /></Field>
          <Field label="Age"><NumberInput value={st.age} onChange={(v) => v && set({ age: Math.round(v) })} /></Field>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-petal px-3 py-2">
          <div><div className="text-[13px] text-muted">Current weight</div><div className="font-semibold">{cur ? `${wIn(cur)} ${kg ? 'kg' : 'lbs'}` : 'Not logged yet'}</div></div>
          <button className="btn-primary btn-sm" onClick={() => setSheet('weight')}>Log weight</button>
        </div>
        <p className="text-[13px] text-muted mt-2">{st.heightIn >= 12 ? `Height ${Math.floor(st.heightIn / 12)}′${Math.round(st.heightIn % 12)}″` : ''}</p>
      </Card>

      <SectionTitle>Daily targets</SectionTitle>
      <Card>
        <div className="grid grid-cols-3 gap-x-3">
          <Field label="Calories"><NumberInput value={st.calTarget} onChange={(v) => v && set({ calTarget: Math.round(v) })} /></Field>
          <Field label="Range low"><NumberInput value={st.calMin} onChange={(v) => v && set({ calMin: Math.round(v) })} /></Field>
          <Field label="Range high"><NumberInput value={st.calMax} onChange={(v) => v && set({ calMax: Math.round(v) })} /></Field>
          <Field label="Protein min (g)"><NumberInput value={st.proteinMin} onChange={(v) => v && set({ proteinMin: Math.round(v) })} /></Field>
          <Field label="Protein max (g)"><NumberInput value={st.proteinMax} onChange={(v) => v && set({ proteinMax: Math.round(v) })} /></Field>
          <Field label="Water (oz)"><NumberInput value={st.waterTarget} onChange={(v) => v && set({ waterTarget: Math.round(v) })} /></Field>
        </div>
        <p className="text-[13px] text-muted">These are your starting estimates. The app never lowers them on its own — adjust only if your real progress over several weeks says so.</p>
      </Card>

      <SectionTitle>Movement</SectionTitle>
      <Card>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Walk length (min)"><NumberInput value={st.walkMinutes} onChange={(v) => v && set({ walkMinutes: Math.round(v) })} /></Field>
          <Field label="Home workout (min)"><NumberInput value={st.workoutMinutes} onChange={(v) => v && set({ workoutMinutes: Math.round(v) })} /></Field>
        </div>
        <button className="btn-soft w-full mb-3" onClick={() => setSheet('schedule')}>Edit exercise schedule</button>
        <Toggle label="Timer sounds" on={st.sound} onChange={(v) => set({ sound: v })} />
        <Toggle label="Vibration (where supported)" on={st.vibration} onChange={(v) => set({ vibration: v })} />
        <Field label="Daily step goal"><NumberInput value={st.stepsGoal} onChange={(v) => v && set({ stepsGoal: Math.round(v) })} /></Field>
        <Toggle label="Hourly stand & stretch nudges (weekdays)" on={st.moveNudge.on} onChange={(v) => set({ moveNudge: { ...st.moveNudge, on: v } })} />
        {st.moveNudge.on && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Field label="From"><input type="time" className="field" value={st.moveNudge.start} onChange={(e) => set({ moveNudge: { ...st.moveNudge, start: e.target.value } })} /></Field>
            <Field label="Until"><input type="time" className="field" value={st.moveNudge.end} onChange={(e) => set({ moveNudge: { ...st.moveNudge, end: e.target.value } })} /></Field>
          </div>
        )}
        <Toggle label="Show cycle info on Home" on={st.cycleOnHome} onChange={(v) => set({ cycleOnHome: v })} />
      </Card>

      <SectionTitle>Meals</SectionTitle>
      <Card>
        <div className="label">Dietary needs</div>
        <p className="text-[13px] text-muted mb-2">Only recipes that fit are used for swaps and new weeks.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {DIETS.map((d) => { const on = st.diets.includes(d.v); return <button key={d.v} className={`chip ${on ? 'chip-on' : ''}`} onClick={() => set({ diets: on ? st.diets.filter((x) => x !== d.v) : [...st.diets, d.v] })}>{d.l}</button>; })}
        </div>
        <button className="btn-ghost btn-sm w-full mb-3" onClick={() => { const today = new Date(); const k = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`; s.generateWeek(weekStart(k), 'rotation'); s.generateWeek(addD(weekStart(k), 7), 'rotation'); toast('This week and next rebuilt to fit'); }}>Rebuild this week & next to fit my diet</button>
        <Toggle label="Auto-fill new weeks from my rotation" on={st.autoFillWeeks} onChange={(v) => set({ autoFillWeeks: v })} />
        <div className="label mt-3">Food dislikes</div>
        <p className="text-[13px] text-muted mb-2">Recipes containing these are skipped when building new weeks.</p>
        <div className="flex flex-wrap gap-2 mb-2">{st.dislikes.map((d) => <button key={d} className="chip" onClick={() => set({ dislikes: st.dislikes.filter((x) => x !== d) })}>{d} ✕</button>)}</div>
        <div className="flex gap-2 mb-3">
          <input className="field flex-1" placeholder="e.g. shrimp" value={dislike} onChange={(e) => setDislike(e.target.value)} />
          <button className="btn-soft" disabled={!dislike.trim()} onClick={() => { set({ dislikes: [...st.dislikes, dislike.trim()] }); setDislike(''); }}><Plus size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-soft btn-sm" onClick={() => setSheet('favorites')}><Heart size={16} />Favorites</button>
          <button className="btn-soft btn-sm" onClick={() => setSheet('foods')}><Utensils size={16} />Food library</button>
        </div>
      </Card>

      <SectionTitle>Look & units</SectionTitle>
      <Card>
        <div className="label">Color</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {([['euca', 'Eucalyptus', '#2F4239', '#E6CFA4'], ['noir', 'Onyx', '#2A2826', '#D9C3A0'], ['ocean', 'Midnight', '#24364A', '#DCC8A4'], ['sand', 'Espresso', '#3A2D24', '#E2C29A'], ['lavender', 'Plum', '#362A44', '#E4C9B0'], ['rose', 'Wine', '#45282F', '#EBC9C0']] as const).map(([v, l, c, c2]) => {
            const on = (st.palette ?? 'euca') === v;
            return (
              <button key={v} aria-pressed={on} onClick={() => set({ palette: v })} className={`rounded-[10px] p-2 flex items-center gap-2 border text-left ${on ? 'border-ink' : 'border-line'}`}>
                <span className="w-6 h-6 rounded-full shrink-0 relative overflow-hidden" style={{ background: c }}><span className="absolute right-0 bottom-0 w-3 h-3" style={{ background: c2 }} /></span>
                <span className="text-[13px]">{l}</span>
              </button>
            );
          })}
        </div>
        <div className="label">Weight</div>
        <div className="mb-3"><Segmented value={st.weightUnit} onChange={(v) => set({ weightUnit: v })} options={[{ value: 'lb', label: 'Pounds' }, { value: 'kg', label: 'Kilograms' }]} /></div>
        <div className="label">Measurements</div>
        <Segmented value={st.lengthUnit} onChange={(v) => set({ lengthUnit: v })} options={[{ value: 'in', label: 'Inches' }, { value: 'cm', label: 'Centimeters' }]} />
      </Card>

      <SectionTitle>Personal touches</SectionTitle>
      <Card>
        <div className="label">Daily message style</div>
        <p className="text-[13px] text-muted mb-2">Home shows a message that fits the time of day and what you still need to do, like water, food or your workout. It changes through the day.</p>
        <div className="space-y-2">
          {QUOTE_STYLES.map((q) => {
            const on = (st.quoteStyle ?? 'motivational') === q.v;
            return (
              <button key={q.v} aria-pressed={on} onClick={() => set({ quoteStyle: q.v })} className={`w-full text-left rounded-[16px] border p-3 ${on ? 'border-ink bg-petal' : 'border-line'}`}>
                <div className="text-[15px] font-medium">{q.label}</div>
                <div className="text-[13px] text-muted mt-0.5">“{q.sample}”</div>
              </button>
            );
          })}
        </div>
      </Card>

      <SectionTitle>Reminders</SectionTitle>
      <Card>
        <button className="btn-soft w-full" onClick={() => setSheet('reminders')}><Bell size={16} />Set reminders</button>
      </Card>
      <div className="mt-2"><NotificationsCard /></div>

      <DataSection onDelete={() => setSheet('delete')} />

      <p className="text-center text-[13px] text-muted mt-8 mb-2">My Glow-Up · private to you · made with</p>

      {sheet === 'weight' && <WeightSheet onClose={() => setSheet(null)} />}
      {sheet === 'schedule' && <ScheduleEditor onClose={() => setSheet(null)} />}
      {sheet === 'foods' && <FoodLibrary onClose={() => setSheet(null)} />}
      {sheet === 'favorites' && <Favorites onClose={() => setSheet(null)} />}
      {sheet === 'reminders' && <Reminders onClose={() => setSheet(null)} />}
      {sheet === 'delete' && <DeleteAll onClose={() => setSheet(null)} />}
    </div>
  );
}

export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} className="w-full flex items-center justify-between py-2 text-left" onClick={() => onChange(!on)}>
      <span className="text-[14px] pr-3">{label}</span>
      <span className={`w-[52px] h-[32px] rounded-full p-1 transition shrink-0 ${on ? 'bg-deep' : 'bg-line'}`}><span className={`block w-6 h-6 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : ''}`} /></span>
    </button>
  );
}

function ScheduleEditor({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const homeOpts: { v: HomeWorkoutType; l: string }[] = [{ v: 'strength', l: 'Full-body strength' }, { v: 'bike', l: 'Stationary bike' }, { v: 'bike-easy', l: 'Easy bike' }, { v: 'rest', l: 'Rest' }];
  const up = (d: number, p: Partial<ScheduleDay>) => s.set((st) => { Object.assign(st.schedule[d], p); });
  return (
    <Sheet open onClose={onClose} title="Exercise schedule">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const sc = s.schedule[d];
        return (
          <div key={d} className="card p-3 mb-2">
            <div className="font-semibold mb-2">{DOW_NAMES[d]}</div>
            <div className="grid grid-cols-2 gap-2">
              <select className="field" aria-label={`${DOW_NAMES[d]} lunch`} value={sc.walk} onChange={(e) => up(d, { walk: e.target.value as any })}>
                <option value="walk">Lunch walk</option><option value="optional">Optional walk</option><option value="recovery">Recovery</option>
              </select>
              <select className="field" aria-label={`${DOW_NAMES[d]} home`} value={sc.home} onChange={(e) => up(d, { home: e.target.value as any })}>{homeOpts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
            </div>
            <label className="flex items-center gap-2 mt-2 text-[13px]"><input type="checkbox" className="w-5 h-5 accent-[var(--rose-deep)]" checked={sc.homeOptional} onChange={(e) => up(d, { homeOptional: e.target.checked })} />Home workout is optional (doesn’t count toward daily habits)</label>
          </div>
        );
      })}
    </Sheet>
  );
}

function Favorites({ onClose }: { onClose: () => void }) {
  const s = useStore();
  return (
    <Sheet open onClose={onClose} title="Favorite meals & desserts">
      <p className="text-[13px] text-muted mb-3">Favorites show first when swapping, and “Mix from my favorites” builds weeks from them.</p>
      {Object.values(s.recipes).map((r) => {
        const on = s.favorites.includes(r.id);
        return (
          <button key={r.id} className="w-full flex items-center justify-between py-2 border-b border-line text-left" onClick={() => s.set((st) => { st.favorites = on ? st.favorites.filter((x) => x !== r.id) : [...st.favorites, r.id]; })}>
            <span><span className="block">{r.name}</span><span className="text-[13px] text-muted">{SLOT_LABEL[r.slot]}</span></span>
            <Heart size={20} className={on ? 'text-rose' : 'text-line'} fill={on ? 'currentColor' : 'none'} />
          </button>
        );
      })}
    </Sheet>
  );
}

function FoodLibrary({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<string | 'new' | null>(null);
  const foods = Object.values(s.foods).filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Sheet open onClose={onClose} title="Food library">
      <p className="text-[13px] text-muted mb-3">Values are generic estimates until you enter them from your package label. Then every recipe using that food updates automatically.</p>
      <button className="btn-primary w-full mb-3" onClick={() => setEdit('new')}><Plus size={18} />Add a food</button>
      <div className="relative mb-3"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><input className="field pl-11" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {foods.map((f) => (
        <button key={f.id} className="w-full text-left py-2 border-b border-line" onClick={() => setEdit(f.id)}>
          <div className="flex justify-between gap-2"><span>{f.name}{f.state ? <span className="text-muted"> · {f.state}</span> : null}</span><span className={`text-[12px] rounded-full px-2 py-0.5 h-fit ${f.estimate ? 'bg-petal text-deep' : 'bg-sage/25 text-sagedeep'}`}>{f.estimate ? 'Estimate' : 'Label'}</span></div>
          <div className="text-[13px] text-muted">{Math.round(f.per100g.cal)} cal · {f.per100g.protein} g protein per 100 g</div>
        </button>
      ))}
      {edit && <FoodEditor id={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
    </Sheet>
  );
}

function FoodEditor({ id, onClose }: { id?: string; onClose: () => void }) {
  const s = useStore();
  const ex = id ? s.foods[id] : undefined;
  const defServ = ex?.units.each ?? 100;
  const [name, setName] = useState(ex?.name ?? '');
  const [state, setState] = useState<Food['state'] | ''>(ex?.state ?? '');
  const [category, setCategory] = useState<GroceryCategory>(ex?.category ?? 'Pantry');
  const [serv, setServ] = useState<number | null>(defServ);
  const k = (defServ ?? 100) / 100;
  const [cal, setCal] = useState<number | null>(ex ? +(ex.per100g.cal * k).toFixed(1) : null);
  const [pro, setPro] = useState<number | null>(ex ? +(ex.per100g.protein * k).toFixed(1) : null);
  const [carb, setCarb] = useState<number | null>(ex ? +(ex.per100g.carbs * k).toFixed(1) : null);
  const [fat, setFat] = useState<number | null>(ex ? +(ex.per100g.fat * k).toFixed(1) : null);
  const [cup, setCup] = useState<number | null>(ex?.units.cup ?? null);
  const [tbsp, setTbsp] = useState<number | null>(ex?.units.tbsp ?? null);
  const [each, setEach] = useState<number | null>(ex?.units.each ?? null);
  const [eachLabel, setEachLabel] = useState(ex?.eachLabel ?? '');
  const [tags, setTags] = useState<FoodTag[]>(ex?.tags ?? []);

  const save = () => {
    if (!name.trim() || !serv || cal == null) { toast('Name, serving size and calories are needed'); return; }
    const m = 100 / serv;
    const per100g = { cal: +(cal * m).toFixed(1), protein: +((pro ?? 0) * m).toFixed(2), carbs: +((carb ?? 0) * m).toFixed(2), fat: +((fat ?? 0) * m).toFixed(2) };
    const units: Food['units'] = {};
    if (cup) units.cup = cup; if (tbsp) units.tbsp = tbsp; if (each) units.each = each;
    if (ex?.units.tsp) units.tsp = ex.units.tsp;
    const nid = ex?.id ?? uid();
    s.set((st) => {
      st.foods[nid] = {
        ...(ex ?? { grocery: { key: nid, name: name.trim(), factor: 1, unitLabel: 'servings', gramsPerUnit: serv, round: 'ceil' }, custom: true }),
        id: nid, name: name.trim(), state: (state || undefined) as any, category, per100g, units, eachLabel: eachLabel || undefined, tags, estimate: false
      } as Food;
    });
    toast('Food saved — recipes updated'); onClose();
  };

  return (
    <Sheet open onClose={onClose} title={ex ? 'Edit from label' : 'Add a food'} footer={<div className="flex gap-2">
      {ex?.custom && <button className="btn-ghost flex-1" onClick={() => { s.set((st) => { delete st.foods[ex.id]; }); onClose(); }}>Delete</button>}
      <button className="btn-primary flex-[2]" onClick={save}>Save</button></div>}>
      <Field label="Name"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Weighed as"><select className="field" value={state} onChange={(e) => setState(e.target.value as any)}><option value="">—</option><option value="raw">Raw</option><option value="cooked">Cooked</option><option value="dry">Dry</option><option value="packaged">Packaged</option><option value="prepared">Prepared</option></select></Field>
        <Field label="Grocery category"><select className="field" value={category} onChange={(e) => setCategory(e.target.value as GroceryCategory)}>{GROCERY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      </div>
      <div className="rounded-2xl bg-petal p-3 mb-3">
        <div className="font-medium mb-2">Nutrition per serving (from the label)</div>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Serving size (g)"><NumberInput value={serv} onChange={setServ} /></Field>
          <Field label="Calories"><NumberInput value={cal} onChange={setCal} /></Field>
          <Field label="Protein (g)"><NumberInput value={pro} onChange={setPro} /></Field>
          <Field label="Carbs (g)"><NumberInput value={carb} onChange={setCarb} /></Field>
          <Field label="Fat (g)"><NumberInput value={fat} onChange={setFat} /></Field>
        </div>
      </div>
      <div className="font-medium mb-2">Measuring (optional)</div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="Grams in 1 cup"><NumberInput value={cup} onChange={setCup} /></Field>
        <Field label="Grams in 1 tbsp"><NumberInput value={tbsp} onChange={setTbsp} /></Field>
        <Field label="Grams in 1 piece"><NumberInput value={each} onChange={setEach} /></Field>
        <Field label="Piece name"><input className="field" value={eachLabel} onChange={(e) => setEachLabel(e.target.value)} placeholder="bar, slice…" /></Field>
      </div>
      <div className="font-medium mb-2">Contains (for diet filtering)</div>
      <div className="flex flex-wrap gap-2">
        {FOOD_TAGS.map((t) => { const on = tags.includes(t.v); return <button key={t.v} className={`chip ${on ? 'chip-on' : ''}`} onClick={() => setTags(on ? tags.filter((x) => x !== t.v) : [...tags, t.v])}>{t.l}</button>; })}
      </div>
    </Sheet>
  );
}

function Reminders({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const upd = (id: string, fn: (r: any) => void) => s.set((st) => { const r = st.settings.reminders.find((x) => x.id === id); if (r) fn(r); });
  return (
    <Sheet open onClose={onClose} title="Reminders">
      <p className="text-[13px] text-muted mb-3">With notifications on, these arrive even when the app is closed. Pick days for weekly things like meal prep.</p>
      {s.settings.reminders.map((r) => (
        <div key={r.id} className="card p-2.5 mb-2">
          <div className="flex items-center gap-2">
            <input className="field flex-1" value={r.label} aria-label="Reminder name" onChange={(e) => upd(r.id, (x) => { x.label = e.target.value; })} />
            <input type="time" className="field w-[110px]" value={r.time} aria-label="Time" onChange={(e) => upd(r.id, (x) => { x.time = e.target.value; })} />
            <button role="switch" aria-checked={r.on} aria-label="On" className={`w-[46px] h-[28px] rounded-full p-1 shrink-0 ${r.on ? 'bg-deep' : 'bg-line'}`} onClick={() => upd(r.id, (x) => { x.on = !x.on; })}><span className={`block w-5 h-5 rounded-full bg-white transition ${r.on ? 'translate-x-[18px]' : ''}`} /></button>
          </div>
          <div className="flex items-center gap-1 mt-2">
            {order.map((d) => {
              const days: number[] = r.days ?? [];
              const on = !days.length || days.includes(d);
              return <button key={d} aria-label={`${DOW_NAMES[d]} ${on ? 'on' : 'off'}`} onClick={() => upd(r.id, (x) => { const cur: number[] = x.days?.length ? x.days : [0, 1, 2, 3, 4, 5, 6]; const next = cur.includes(d) ? cur.filter((y: number) => y !== d) : [...cur, d]; x.days = next.length === 7 ? undefined : next; })}
                className={`flex-1 rounded-lg py-1 text-[11px] font-medium ${on ? 'bg-petal text-deep' : 'text-muted border border-line'}`}>{DOW_NAMES[d].slice(0, 2)}</button>;
            })}
            <button aria-label="Delete reminder" className="w-8 h-8 grid place-items-center text-muted" onClick={() => s.set((st) => { st.settings.reminders = st.settings.reminders.filter((x) => x.id !== r.id); })}><Trash2 size={15} /></button>
          </div>
        </div>
      ))}
      <button className="btn-ghost btn-sm w-full mb-3" onClick={() => s.set((st) => { st.settings.reminders.push({ id: uid(), label: 'New reminder', time: '20:00', on: true }); })}><Plus size={16} />Add reminder</button>
      <button className="btn-ghost btn-sm w-full" onClick={() => s.set((st) => { st.settings.reminders.push({ id: uid(), label: 'Meal prep day! 🥗', time: '10:00', on: true, days: [st.settings.prepDays?.sunday ?? 0, st.settings.prepDays?.wednesday ?? 3] }); })}><Plus size={16} />Add meal prep reminder</button>
    </Sheet>
  );
}

export function NotificationsCard() {
  const s = useStore();
  const { member } = useSync();
  const [busy, setBusy] = useState(false);
  const on = !!s.settings.pushOn && typeof Notification !== 'undefined' && Notification.permission === 'granted';
  const standalone = isStandaloneApp();
  return (
    <Card>
      <div className="flex items-start gap-2.5 mb-2">
        <Bell size={18} className={on ? 'text-deep shrink-0 mt-0.5' : 'text-muted shrink-0 mt-0.5'} />
        <div className="text-[13px]">
          {on ? <><b>Notifications are on.</b> Reminders and friend activity arrive even when the app is closed.</>
            : !member ? 'Sign in (Social tab) to get notifications even when the app is closed.'
            : !standalone && isIOS() ? 'Open My Glow-Up from your Home Screen icon, then turn notifications on here.'
            : 'Get reminders and friend activity even when the app is closed.'}
        </div>
      </div>
      {!on ? (
        <button className="btn-primary w-full" disabled={busy || !member} onClick={async () => { setBusy(true); try { await enablePush(); toast('Notifications on'); } catch (e: any) { toast(e?.message ?? 'Couldn’t turn on notifications'); } setBusy(false); }}><Bell size={16} />Turn on notifications</button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-soft btn-sm" onClick={async () => { try { const n = await sendTest(); toast(n ? 'Test sent — check your notifications' : 'No devices found — try turning notifications off and on'); } catch (e: any) { toast(e?.message ?? 'Couldn’t send'); } }}>Send a test</button>
          <button className="btn-ghost btn-sm" onClick={async () => { await disablePush(); toast('Notifications off on this phone'); }}>Turn off</button>
        </div>
      )}
      <div className="mt-2">
        <Toggle label="Friend messages" on={s.settings.notifyMessages !== false} onChange={(v) => s.set((x) => { x.settings.notifyMessages = v; })} />
        <Toggle label="Reactions to my posts" on={s.settings.notifyReactions !== false} onChange={(v) => s.set((x) => { x.settings.notifyReactions = v; })} />
      </div>
    </Card>
  );
}

function DataSection({ onDelete }: { onDelete: () => void }) {
  const s = useStore();
  const [photos, setPhotos] = useState(true);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<string>('');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
    navigator.storage?.estimate?.().then((e) => setUsage(e.usage ? `${(e.usage / 1024 / 1024).toFixed(1)} MB used` : '')).catch(() => {});
  }, []);
  const days = s.lastBackup ? Math.floor((Date.now() - s.lastBackup) / 86400000) : null;

  const doExport = async () => {
    const text = await exportData(stateOnly(useStore.getState()), photos);
    downloadText(`my-glow-up-backup-${todayKey()}.json`, text);
    s.set((st) => { st.lastBackup = Date.now(); });
    toast('Backup downloaded');
  };
  const doImport = async (f?: File) => {
    if (!f) return;
    try {
      const { state, photos } = await parseBackup(await f.text());
      if (!confirm('Replace everything in the app with this backup?')) return;
      await restorePhotos(photos);
      s.replaceAll({ ...state, session: null } as any);
      toast('Backup restored');
    } catch (e: any) { toast(e?.message ?? 'Couldn’t read that file'); }
  };

  return (
    <>
      <SectionTitle>Account</SectionTitle>
      <div className="mb-3"><CloudCard /></div>
      <div className="mb-3"><JoinGroupCard /></div>
      <Card>
        <button className="btn-ghost btn-sm w-full" onClick={doExport}><Download size={16} />Download a copy of my data</button>
        <button className="btn-ghost btn-sm w-full mt-2 text-deep" onClick={onDelete}><Trash2 size={16} />Delete data…</button>
      </Card>
    </>
  );
}

function DeleteAll({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [txt, setTxt] = useState('');
  const keep = (fn: (x: any) => void, msg: string) => { s.set(fn); toast(msg); onClose(); };
  return (
    <Sheet open onClose={onClose} title="Delete data">
      <p className="text-muted text-[14px] mb-3">These can’t be undone, and they also apply to your account.</p>
      <button className="btn-ghost w-full mb-2" onClick={() => keep((x) => { x.logs = []; }, 'Food log cleared')}>Clear food log</button>
      <button className="btn-ghost w-full mb-2" onClick={() => keep((x) => { x.weights = []; x.measures = []; }, 'Weight & measurements cleared')}>Clear weight & measurements</button>
      <button className="btn-ghost w-full mb-2" onClick={() => keep((x) => { x.workouts = []; }, 'Workout history cleared')}>Clear workout history</button>
      <button className="btn-ghost w-full mb-2" onClick={() => keep((x) => { x.habitChecks = {}; x.water = {}; x.notes = {}; }, 'Habits cleared')}>Clear habit history</button>
      <button className="btn-ghost w-full mb-2" onClick={() => keep((x) => { x.periods = []; x.cycleDays = {}; }, 'Cycle data cleared')}>Clear cycle data</button>
      <button className="btn-ghost w-full mb-2" onClick={() => keep((x) => { x.checkins = []; x.steps = {}; }, 'Check-ins & steps cleared')}>Clear check-ins & steps</button>
      <button className="btn-ghost w-full mb-3" onClick={async () => { await clearPhotos(); keep((x) => { x.photos = []; }, 'Photos deleted'); }}>Delete all photos</button>
      <div className="rounded-2xl border border-blush p-3">
        <div className="font-medium mb-2">Start completely fresh</div>
        <p className="text-[13px] text-muted mb-2">Type DELETE to erase everything and restore the starting recipes.</p>
        <input className="field mb-2" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="DELETE" />
        <button className="btn-primary w-full" disabled={txt !== 'DELETE'} onClick={async () => { await clearPhotos(); s.replaceAll(initialState()); toast('Everything erased'); onClose(); }}>Erase everything</button>
      </div>
    </Sheet>
  );
}
