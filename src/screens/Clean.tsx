import { useState } from 'react';
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { useToday } from '../lib/derived';
import { DOW_NAMES, addDays, fmtDow, fmtShort, uid, weekDays, weekStart } from '../lib/date';
import type { CleanTask } from '../lib/types';
import { isDue, lastDoneBefore, freqLabel } from '../lib/clean';
import { Bar, Card, CheckCircle, Field, Header, NumberInput, Segmented, Sheet, toast } from '../components/ui';

// before the first completion, count from the day before the person started (so nothing starts out overdue)
const withLast = (t: CleanTask, done: Record<string, string[]>, date: string, start?: string) => ({ ...t, lastDone: lastDoneBefore(done, t.id, date) ?? (start ? addDays(start, -1) : undefined) });

export default function Clean() {
  const [tab, setTab] = useState<'today' | 'week' | 'all'>('today');
  return (
    <div>
      <Header eyebrow="A calm, cared-for home" title="Cleaning" />
      <div className="mb-3"><Segmented value={tab} onChange={setTab} options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'This week' }, { value: 'all', label: 'All tasks' }]} /></div>
      {tab === 'today' && <Today />}
      {tab === 'week' && <Week />}
      {tab === 'all' && <AllTasks />}
    </div>
  );
}

export function tasksFor(s: ReturnType<typeof useStore.getState>, date: string) {
  const done = s.cleanDone[date] ?? [];
  return s.cleanTasks.filter((t) => done.includes(t.id) || isDue(withLast(t, s.cleanDone, date, s.settings.startDate), date));
}

function Today() {
  const s = useStore();
  const today = useToday();
  const list = tasksFor(s, today);
  const done = s.cleanDone[today] ?? [];
  const mins = list.filter((t) => !done.includes(t.id)).reduce((a, t) => a + t.minutes, 0);
  const toggle = (id: string) => s.set((x) => {
    const cur = x.cleanDone[today] ?? [];
    x.cleanDone[today] = cur.includes(id) ? cur.filter((y) => y !== id) : [...cur, id];
  });
  const rooms = [...new Set(list.map((t) => t.room))];
  return (
    <div className="space-y-2">
      <Card>
        <div className="flex justify-between items-center mb-2">
          <div><div className="font-semibold">{done.filter((d) => list.some((t) => t.id === d)).length} of {list.length} done</div><div className="text-[13px] text-muted">{mins ? `About ${mins} minutes left` : list.length ? 'All done — enjoy your space' : 'Nothing scheduled today'}</div></div>
          <Sparkles className="text-rose" />
        </div>
        <Bar pct={list.length ? (done.filter((d) => list.some((t) => t.id === d)).length / list.length) * 100 : 0} color="var(--sage)" />
      </Card>
      {rooms.map((r) => (
        <div key={r}>
          <h3 className="eyebrow mb-2 px-1">{r}</h3>
          <div className="card divide-y divide-line !rounded-2xl">
            {list.filter((t) => t.room === r).map((t) => {
              const on = done.includes(t.id);
              const overdue = (t.freq === 'every' || t.freq === 'monthly') && !on;
              return (
                <div key={t.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={() => toggle(t.id)}>
                  <CheckCircle on={on} onToggle={() => toggle(t.id)} label={t.name} />
                  <div className="flex-1 min-w-0"><div className={on ? 'line-through text-muted decoration-blush' : ''}>{t.name}</div>
                    <div className="text-[13px] text-muted">{t.minutes} min · {freqLabel(t)}{overdue ? ' · due' : ''}</div></div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Week() {
  const s = useStore();
  const today = useToday();
  const days = weekDays(weekStart(today));
  return (
    <div className="space-y-2">
      {days.map((d) => {
        const list = s.cleanTasks.filter((t) => t.freq === 'weekly' ? (t.days ?? []).includes(new Date(d + 'T12:00').getDay()) : false);
        const done = s.cleanDone[d] ?? [];
        return (
          <div key={d} className={`card p-3 ${d === today ? 'border-rose' : ''}`}>
            <div className="flex justify-between mb-1"><div className="font-semibold">{fmtDow(d)} {fmtShort(d)}{d === today && <span className="text-deep text-[13px] ml-2">Today</span>}</div><div className="text-[13px] text-muted">{list.reduce((a, t) => a + t.minutes, 0)} min</div></div>
            {list.length ? list.map((t) => <div key={t.id} className={`text-[14px] ${done.includes(t.id) ? 'line-through text-muted' : ''}`}>• {t.name}</div>) : <div className="text-[13px] text-muted">Just the daily basics</div>}
          </div>
        );
      })}
      <p className="text-[13px] text-muted">Daily tasks show every day on Today. Monthly and every-few-days tasks appear when they’re due and stay until you check them off.</p>
    </div>
  );
}

function AllTasks() {
  const s = useStore();
  const [edit, setEdit] = useState<CleanTask | 'new' | null>(null);
  const [rooms, setRooms] = useState(false);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary btn-sm" onClick={() => setEdit('new')}><Plus size={16} />New task</button>
        <button className="btn-soft btn-sm" onClick={() => setRooms(true)}>Edit rooms</button>
      </div>
      {s.rooms.map((r) => {
        const list = s.cleanTasks.filter((t) => t.room === r);
        if (!list.length) return null;
        return (
          <div key={r}>
            <h3 className="eyebrow mb-2 px-1">{r}</h3>
            <div className="card divide-y divide-line !rounded-2xl">
              {list.map((t) => (
                <button key={t.id} className="w-full flex items-center gap-2 px-3 py-2 text-left" onClick={() => setEdit(t)}>
                  <div className="flex-1 min-w-0"><div>{t.name}</div><div className="text-[13px] text-muted">{freqLabel(t)} · {t.minutes} min</div></div>
                  <Pencil size={15} className="text-muted" />
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {edit && <TaskEditor task={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
      {rooms && <RoomEditor onClose={() => setRooms(false)} />}
    </div>
  );
}

function TaskEditor({ task, onClose }: { task: CleanTask | null; onClose: () => void }) {
  const s = useStore();
  const [t, setT] = useState<CleanTask>(task ?? { id: uid(), name: '', room: s.rooms[0] ?? 'Whole home', freq: 'weekly', days: [6], minutes: 10 });
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <Sheet open onClose={onClose} title={task ? 'Edit task' : 'New task'} footer={<div className="flex gap-2">
      {task && <button className="btn-ghost flex-1" onClick={() => { s.set((x) => { x.cleanTasks = x.cleanTasks.filter((y) => y.id !== t.id); }); toast('Task deleted'); onClose(); }}><Trash2 size={16} />Delete</button>}
      <button className="btn-primary flex-[2]" disabled={!t.name.trim() || (t.freq === 'weekly' && !(t.days ?? []).length)} onClick={() => {
        s.set((x) => { const i = x.cleanTasks.findIndex((y) => y.id === t.id); const v = { ...t, name: t.name.trim() }; if (i >= 0) x.cleanTasks[i] = v; else x.cleanTasks.push(v); });
        toast('Saved'); onClose();
      }}>Save</button></div>}>
      <Field label="Task"><input className="field" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} placeholder="e.g. Water the plants" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Room"><select className="field" value={t.room} onChange={(e) => setT({ ...t, room: e.target.value })}>{s.rooms.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Minutes"><NumberInput value={t.minutes} onChange={(v) => v && setT({ ...t, minutes: Math.round(v) })} /></Field>
      </div>
      <Field label="How often"><select className="field" value={t.freq} onChange={(e) => setT({ ...t, freq: e.target.value as any })}>
        <option value="daily">Every day</option><option value="weekly">On certain weekdays</option><option value="every">Every few days</option><option value="monthly">Once a month</option></select></Field>
      {t.freq === 'weekly' && (
        <div className="grid grid-cols-7 gap-1.5 mb-3">{order.map((d) => {
          const on = (t.days ?? []).includes(d);
          return <button key={d} onClick={() => setT({ ...t, days: on ? (t.days ?? []).filter((x) => x !== d) : [...(t.days ?? []), d] })} className={`rounded-xl py-2 text-[13px] font-medium ${on ? 'bg-deep text-white' : 'bg-petal'}`}>{DOW_NAMES[d].slice(0, 3)}</button>;
        })}</div>
      )}
      {t.freq === 'every' && <Field label="Every how many days?"><NumberInput value={t.every ?? 7} onChange={(v) => v && setT({ ...t, every: Math.max(1, Math.round(v)) })} /></Field>}
      {t.freq === 'monthly' && <Field label="Day of the month"><NumberInput value={t.monthDay ?? 1} onChange={(v) => v && setT({ ...t, monthDay: Math.min(31, Math.max(1, Math.round(v))) })} /></Field>}
    </Sheet>
  );
}

function RoomEditor({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [name, setName] = useState('');
  return (
    <Sheet open onClose={onClose} title="Rooms">
      {s.rooms.map((r, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input className="field flex-1" value={r} aria-label="Room name" onChange={(e) => s.set((x) => { const old = x.rooms[i]; x.rooms[i] = e.target.value; x.cleanTasks.forEach((t) => { if (t.room === old) t.room = e.target.value; }); })} />
          <button aria-label="Delete room" className="w-10 h-10 grid place-items-center text-muted" disabled={s.cleanTasks.some((t) => t.room === r)} title="Move or delete its tasks first"
            onClick={() => s.set((x) => { x.rooms = x.rooms.filter((_, j) => j !== i); })}><Trash2 size={17} /></button>
        </div>
      ))}
      <p className="text-[13px] text-muted mb-3">A room can be deleted once it has no tasks.</p>
      <div className="flex gap-2"><input className="field flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kids’ room" />
        <button className="btn-primary" disabled={!name.trim()} onClick={() => { s.set((x) => { x.rooms.push(name.trim()); }); setName(''); }}><Plus size={18} /></button></div>
    </Sheet>
  );
}
