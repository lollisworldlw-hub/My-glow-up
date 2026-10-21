import { useEffect, useRef, useState } from 'react';
import { HeartHandshake, Pencil, Plus, Trash2, Wind } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../lib/store';
import { useToday } from '../lib/derived';
import { addDays, fmtShort, fromKey, toKey, uid, weekDays, weekStart } from '../lib/date';
import type { MindGoal } from '../lib/types';
import { Bar, Card, CheckCircle, Field, Header, NumberInput, SectionTitle, Segmented, Sheet, toast } from '../components/ui';

export const MOODS = [
  { v: 1, e: '😞', l: 'Rough' }, { v: 2, e: '😕', l: 'Low' }, { v: 3, e: '😐', l: 'Okay' }, { v: 4, e: '🙂', l: 'Good' }, { v: 5, e: '😊', l: 'Great' }
];

export default function Mind() {
  const [tab, setTab] = useState<'today' | 'goals' | 'tools'>('today');
  return (
    <div>
      <Header eyebrow="Gentle care for your mind" title="Mind" />
      <div className="mb-5"><Segmented value={tab} onChange={setTab} options={[{ value: 'today', label: 'Check-in' }, { value: 'goals', label: 'Goals' }, { value: 'tools', label: 'Calm tools' }]} /></div>
      {tab === 'today' && <MoodToday />}
      {tab === 'goals' && <MindGoals />}
      {tab === 'tools' && <Tools />}
      <Card className="mt-6 bg-petal border-blush">
        <div className="flex gap-3 items-start"><HeartHandshake className="text-deep shrink-0" size={20} />
          <p className="text-[13px]">Having a hard time? You don’t have to carry it alone. Reach out to someone you trust or a professional. In the US you can call or text <b>988</b> any time to talk with someone.</p></div>
      </Card>
      <p className="text-[13px] text-muted mt-3 text-center">Your mood and notes are private and never shared with friends.</p>
    </div>
  );
}

function MoodToday() {
  const s = useStore();
  const today = useToday();
  const [date, setDate] = useState(today);
  const entry = s.moods[date] ?? { mood: 0, tags: [], note: '', gratitude: ['', '', ''] };
  const [editTags, setEditTags] = useState(false);
  const up = (p: Partial<typeof entry>) => s.set((x) => { x.moods[date] = { ...entry, ...p, gratitude: p.gratitude ?? entry.gratitude ?? ['', '', ''] }; });
  const days = Array.from({ length: 30 }).map((_, i) => addDays(today, i - 29));
  const data = days.filter((d) => s.moods[d]?.mood).map((d) => ({ t: fromKey(d).getTime(), m: s.moods[d].mood }));

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="eyebrow">How are you feeling?</div>
          <input type="date" aria-label="Day" className="text-[13px] bg-transparent text-muted" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <button key={m.v} aria-pressed={entry.mood === m.v} onClick={() => up({ mood: m.v })}
              className={`rounded-2xl py-3 flex flex-col items-center gap-1 border transition ${entry.mood === m.v ? 'bg-petal border-rose' : 'border-line bg-card'}`}>
              <span className="text-[21px]">{m.e}</span><span className="text-[12px] text-muted">{m.l}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 mb-2"><div className="label !mb-0">What’s going on?</div><button className="text-[13px] text-deep" onClick={() => setEditTags(true)}>Edit</button></div>
        <div className="flex flex-wrap gap-2">
          {s.moodTags.map((t) => {
            const on = entry.tags.includes(t);
            return <button key={t} className={`chip ${on ? 'chip-on' : ''}`} onClick={() => up({ tags: on ? entry.tags.filter((x) => x !== t) : [...entry.tags, t] })}>{t}</button>;
          })}
        </div>
        <Field label="Notes"><textarea className="field py-3 mt-3 min-h-[80px]" value={entry.note} onChange={(e) => up({ note: e.target.value })} placeholder="Anything on your mind…" /></Field>
        <div className="label">Three good things</div>
        {[0, 1, 2].map((i) => (
          <input key={i} className="field mb-2" placeholder={['Something I’m grateful for', 'Something that made me smile', 'Something I did well'][i]}
            value={entry.gratitude?.[i] ?? ''} onChange={(e) => { const g = [...(entry.gratitude ?? ['', '', ''])]; g[i] = e.target.value; up({ gratitude: g }); }} />
        ))}
      </Card>
      <Card>
        <div className="eyebrow mb-2">Last 30 days</div>
        {data.length < 2 ? <p className="text-[14px] text-muted">Your mood trend appears after a few check-ins.</p> : (
          <div className="h-[180px] -ml-3">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(t) => fmtShort(toKey(new Date(t)))} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--line)" minTickGap={28} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(v) => MOODS[v - 1]?.e ?? ''} width={36} stroke="var(--line)" />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14 }} labelFormatter={(t) => fmtShort(toKey(new Date(t as number)))} formatter={(v: any) => [MOODS[v - 1]?.l, 'Mood']} />
                <Line dataKey="m" stroke="var(--rose-deep)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--blush)' }} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      {editTags && <TagEditor onClose={() => setEditTags(false)} />}
    </div>
  );
}

function TagEditor({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [t, setT] = useState('');
  return (
    <Sheet open onClose={onClose} title="Feeling words">
      <div className="flex flex-wrap gap-2 mb-4">{s.moodTags.map((x) => <button key={x} className="chip" onClick={() => s.set((st) => { st.moodTags = st.moodTags.filter((y) => y !== x); })}>{x} ✕</button>)}</div>
      <div className="flex gap-2"><input className="field flex-1" value={t} onChange={(e) => setT(e.target.value)} placeholder="Add a word" />
        <button className="btn-primary" disabled={!t.trim()} onClick={() => { s.set((st) => { if (!st.moodTags.includes(t.trim())) st.moodTags.push(t.trim()); }); setT(''); }}><Plus size={18} /></button></div>
    </Sheet>
  );
}

function MindGoals() {
  const s = useStore();
  const today = useToday();
  const [edit, setEdit] = useState<MindGoal | 'new' | null>(null);
  const week = weekDays(weekStart(today));
  const doneToday = s.mindChecks[today] ?? [];
  const toggle = (id: string) => s.set((x) => {
    const cur = x.mindChecks[today] ?? [];
    x.mindChecks[today] = cur.includes(id) ? cur.filter((y) => y !== id) : [...cur, id];
  });
  return (
    <div className="space-y-3">
      {s.mindGoals.map((g) => {
        const count = week.filter((d) => s.mindChecks[d]?.includes(g.id)).length;
        return (
          <div key={g.id} className="card p-4">
            <div className="flex items-center gap-3">
              <span className="text-[19px] w-10 text-center" aria-hidden>{g.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{g.name}</div>
                <div className="text-[13px] text-muted">{count} of {g.perWeek} this week{count >= g.perWeek ? ' ♡' : ''}</div>
              </div>
              <button aria-label={`Edit ${g.name}`} className="w-10 h-10 grid place-items-center text-muted" onClick={() => setEdit(g)}><Pencil size={16} /></button>
              <CheckCircle on={doneToday.includes(g.id)} onToggle={() => toggle(g.id)} label={`${g.name} today`} />
            </div>
            <div className="mt-3"><Bar pct={(count / g.perWeek) * 100} color="var(--sage)" h={8} /></div>
            <div className="flex justify-between mt-2">{week.map((d) => <span key={d} className={`w-7 h-7 rounded-full text-[11px] grid place-items-center ${s.mindChecks[d]?.includes(g.id) ? 'bg-sage text-white' : d === today ? 'border border-rose' : 'bg-petal text-muted'}`}>{fromKey(d).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>)}</div>
          </div>
        );
      })}
      <button className="btn-soft w-full" onClick={() => setEdit('new')}><Plus size={18} />Add a mental health goal</button>
      {edit && <GoalEditor goal={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function GoalEditor({ goal, onClose }: { goal: MindGoal | null; onClose: () => void }) {
  const s = useStore();
  const [g, setG] = useState<MindGoal>(goal ?? { id: uid(), name: '', perWeek: 3, icon: '🌿' });
  const ICONS = ['🌿', '🫧', '📓', '💌', '🌙', '🎀', '🧘‍♀️', '☀️', '🎨', '📚', '🛁', '🎵', '🙏', '💬', '🚶‍♀️', '📵'];
  return (
    <Sheet open onClose={onClose} title={goal ? 'Edit goal' : 'New goal'} footer={<div className="flex gap-2">
      {goal && <button className="btn-ghost flex-1" onClick={() => { s.set((x) => { x.mindGoals = x.mindGoals.filter((y) => y.id !== g.id); }); onClose(); }}><Trash2 size={16} />Delete</button>}
      <button className="btn-primary flex-[2]" disabled={!g.name.trim()} onClick={() => { s.set((x) => { const i = x.mindGoals.findIndex((y) => y.id === g.id); if (i >= 0) x.mindGoals[i] = g; else x.mindGoals.push(g); }); toast('Saved'); onClose(); }}>Save</button></div>}>
      <Field label="Goal"><input className="field" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} placeholder="e.g. Read for 15 minutes" /></Field>
      <Field label="Times per week"><NumberInput value={g.perWeek} onChange={(v) => v && setG({ ...g, perWeek: Math.min(7, Math.max(1, Math.round(v))) })} /></Field>
      <div className="label">Icon</div>
      <div className="flex flex-wrap gap-2">{ICONS.map((i) => <button key={i} onClick={() => setG({ ...g, icon: i })} className={`w-10 h-10 rounded-full text-[17px] ${g.icon === i ? 'bg-deep' : 'bg-petal'}`}>{i}</button>)}</div>
    </Sheet>
  );
}

function Tools() {
  return (
    <div className="space-y-3">
      <Breathing />
      <Card>
        <div className="eyebrow mb-2">5-4-3-2-1 grounding</div>
        <p className="text-[14px] mb-2">When your mind is racing, gently notice:</p>
        <ul className="space-y-1.5 text-[14px]">
          <li><b>5</b> things you can see</li><li><b>4</b> things you can touch</li><li><b>3</b> things you can hear</li><li><b>2</b> things you can smell</li><li><b>1</b> thing you can taste</li>
        </ul>
      </Card>
      <Card>
        <div className="eyebrow mb-2">Kind self-talk</div>
        <p className="text-[14px]">Try speaking to yourself the way you’d speak to a dear friend: “This is hard, and I’m doing my best. One small step is enough today.”</p>
      </Card>
    </div>
  );
}

const PHASES = [{ l: 'Breathe in', s: 4 }, { l: 'Hold', s: 4 }, { l: 'Breathe out', s: 4 }, { l: 'Hold', s: 4 }];
function Breathing() {
  const [mins, setMins] = useState(2);
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const raf = useRef<number>();
  useEffect(() => {
    if (!start) return;
    const loop = () => { setNow(Date.now()); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current!);
  }, [start]);
  const el = start ? (now - start) / 1000 : 0;
  const total = mins * 60;
  useEffect(() => { if (start && el >= total) { setStart(null); toast('Lovely. Notice how you feel ♡'); } }, [start, el >= total]);
  const cyc = el % 16;
  const idx = Math.floor(cyc / 4);
  const within = (cyc % 4) / 4;
  const scale = idx === 0 ? 0.6 + 0.4 * within : idx === 1 ? 1 : idx === 2 ? 1 - 0.4 * within : 0.6;
  return (
    <Card>
      <div className="flex items-center justify-between mb-3"><div className="eyebrow">Box breathing</div><Wind size={18} className="text-rose" /></div>
      <div className="grid place-items-center py-4">
        <div className="w-[200px] h-[200px] rounded-full bg-petal grid place-items-center">
          <div className="rounded-full bg-blush grid place-items-center transition-none" style={{ width: 180 * (start ? scale : 0.7), height: 180 * (start ? scale : 0.7) }}>
            <div className="text-center"><div className="font-serif text-[18px] font-semibold text-ink">{start ? PHASES[idx].l : 'Ready'}</div>{start && <div className="text-[13px]">{Math.ceil(4 - (cyc % 4))}</div>}</div>
          </div>
        </div>
      </div>
      {start ? (
        <button className="btn-ghost w-full" onClick={() => setStart(null)}>Stop · {Math.ceil((total - el) / 60)} min left</button>
      ) : (
        <>
          <div className="mb-3"><Segmented small value={String(mins)} onChange={(v) => setMins(Number(v))} options={[{ value: '1', label: '1 min' }, { value: '2', label: '2 min' }, { value: '5', label: '5 min' }]} /></div>
          <button className="btn-primary w-full" onClick={() => setStart(Date.now())}>Begin</button>
        </>
      )}
    </Card>
  );
}
