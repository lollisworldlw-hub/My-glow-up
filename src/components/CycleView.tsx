import { useState } from 'react';
import { CalendarHeart, Droplet, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import type { Flow, Period } from '../lib/types';
import { addDays, daysBetween, fmtShort, todayKey, uid } from '../lib/date';
import { useToday } from '../lib/derived';
import { SYMPTOMS, avgCycle, avgPeriodLength, currentPeriod, cycleStatus, isPeriodDay, PHASE_NOTE, sortPeriods } from '../lib/cycle';
import { Card, Field, SectionTitle, Sheet, toast } from './ui';

const FLOWS: { v: Flow; l: string }[] = [{ v: 'spotting', l: 'Spotting' }, { v: 'light', l: 'Light' }, { v: 'medium', l: 'Medium' }, { v: 'heavy', l: 'Heavy' }];

export function CycleView() {
  const s = useStore();
  const today = useToday();
  const [date, setDate] = useState(today);
  const [edit, setEdit] = useState<Period | null>(null);
  const [month, setMonth] = useState(today.slice(0, 7));
  const st = cycleStatus(s.periods, today);
  const cur = currentPeriod(s.periods, today);
  const log = s.cycleDays[date] ?? { symptoms: [] };
  const periods = sortPeriods(s.periods);
  const { length, fromData } = avgCycle(s.periods);
  const plen = avgPeriodLength(s.periods);

  const setDay = (patch: Partial<{ flow?: Flow; symptoms: string[] }>) => s.set((x) => {
    const d = x.cycleDays[date] ?? { symptoms: [] };
    x.cycleDays[date] = { ...d, ...patch };
  });

  const start = () => {
    s.set((x) => {
      if (x.periods.some((p) => p.start === date)) return;
      // close any open period first
      for (const p of x.periods) if (!p.end && p.start < date) { const a = addDays(date, -1), b = addDays(p.start, 4); p.end = a < b ? a : b; }
      x.periods.push({ id: uid(), start: date });
      x.cycleDays[date] = { ...(x.cycleDays[date] ?? { symptoms: [] }), flow: x.cycleDays[date]?.flow ?? 'medium' };
    });
    toast('Period logged ♡');
  };
  const end = () => {
    if (!cur) return;
    s.set((x) => { const p = x.periods.find((y) => y.id === cur.id); if (p) p.end = date < p.start ? p.start : date; });
    toast('Period end saved');
  };

  // calendar
  const [y, mo] = month.split('-').map(Number);
  const first = new Date(y, mo - 1, 1, 12);
  const daysIn = new Date(y, mo, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const predicted = (d: string) => {
    if (!st || cur) return false;
    let n = st.nextStart;
    for (let k = 0; k < 3; k++) {
      if (d >= n && d <= addDays(n, plen - 1)) return true;
      n = addDays(n, length);
    }
    return false;
  };

  return (
    <div className="space-y-3">
      <Card>
        {st ? (
          <>
            <div className="eyebrow">Cycle day {st.day}</div>
            <div className="h-serif text-[24px] leading-tight mt-1">{st.phase}</div>
            <p className="text-[14px] mt-1">{PHASE_NOTE[st.phase]}</p>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <Mini l="Next period" v={cur ? '—' : st.until >= 0 ? `~${fmtShort(st.nextStart)}` : `${-st.until}d late`} />
              <Mini l="Avg cycle" v={`${length} days`} />
              <Mini l="Avg period" v={`${plen} days`} />
            </div>
            {!fromData && <p className="text-[13px] text-muted mt-2">Predictions use a typical 28-day cycle until you’ve logged two periods.</p>}
          </>
        ) : (
          <div className="flex gap-3 items-start">
            <span className="w-10 h-10 rounded-full bg-petal text-deep grid place-items-center shrink-0"><CalendarHeart size={19} /></span>
            <div><div className="font-semibold">Log your last period to begin</div><p className="text-[13px] text-muted">Set the date below to when it started, then tap “My period started.”</p></div>
          </div>
        )}
      </Card>

      <Card>
        <Field label="Day"><input type="date" className="field" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
        {cur && date >= cur.start
          ? <button className="btn-primary w-full mb-4" onClick={end}>My period ended {date === today ? 'today' : `on ${fmtShort(date)}`}</button>
          : <button className="btn-primary w-full mb-4" onClick={start}><Droplet size={18} />My period started {date === today ? 'today' : `on ${fmtShort(date)}`}</button>}
        <div className="label">Flow</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {FLOWS.map((f) => <button key={f.v} className={`chip ${log.flow === f.v ? 'chip-on' : ''}`} onClick={() => setDay({ flow: log.flow === f.v ? undefined : f.v })}>{f.l}</button>)}
        </div>
        <div className="label">How you feel</div>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((x) => {
            const on = log.symptoms.includes(x);
            return <button key={x} className={`chip ${on ? 'chip-on' : ''}`} onClick={() => setDay({ symptoms: on ? log.symptoms.filter((y) => y !== x) : [...log.symptoms, x] })}>{x}</button>;
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <button aria-label="Previous month" className="w-10 h-10 rounded-full bg-petal text-deep" onClick={() => { const d = new Date(y, mo - 2, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}>‹</button>
          <div className="font-semibold">{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button aria-label="Next month" className="w-10 h-10 rounded-full bg-petal text-deep" onClick={() => { const d = new Date(y, mo, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}>›</button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[12px] text-muted mb-1">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: lead }).map((_, i) => <div key={'l' + i} />)}
          {Array.from({ length: daysIn }).map((_, i) => {
            const d = `${month}-${String(i + 1).padStart(2, '0')}`;
            const per = d <= today && isPeriodDay(s.periods, d, today);
            const pred = d > today && predicted(d);
            const sym = (s.cycleDays[d]?.symptoms.length ?? 0) > 0;
            return (
              <button key={d} onClick={() => d <= today && setDate(d)} aria-label={d}
                className={`aspect-square rounded-xl grid place-items-center text-[13px] relative ${per ? 'bg-rose text-white' : pred ? 'border-2 border-dashed border-blush' : 'bg-petal'} ${d === date ? 'ring-2 ring-deep' : ''}`}>
                {i + 1}
                {sym && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${per ? 'bg-white' : 'bg-deep'}`} />}
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 text-[13px] text-muted mt-3"><span><span className="inline-block w-3 h-3 rounded bg-rose align-middle mr-1" />Period</span><span><span className="inline-block w-3 h-3 rounded border-2 border-dashed border-blush align-middle mr-1" />Predicted</span><span><span className="inline-block w-1.5 h-1.5 rounded-full bg-deep align-middle mr-1" />Symptoms</span></div>
      </Card>

      {periods.length > 0 && (
        <>
          <SectionTitle>History</SectionTitle>
          <div className="card divide-y divide-line !rounded-2xl">
            {[...periods].reverse().map((p, i, arr) => {
              const next = arr[i - 1];
              return (
                <button key={p.id} className="w-full text-left px-4 py-3 flex justify-between" onClick={() => setEdit(p)}>
                  <span>{fmtShort(p.start)} – {p.end ? fmtShort(p.end) : 'ongoing'}</span>
                  <span className="text-muted text-[13px]">{p.end ? `${daysBetween(p.start, p.end) + 1}-day period` : ''}{next ? ` · ${daysBetween(p.start, next.start)}-day cycle` : ''}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
      <p className="text-[13px] text-muted">Predictions are estimates for planning only — not for preventing or planning pregnancy. If your cycle changes a lot, it’s worth mentioning to your doctor.</p>
      {edit && <EditPeriod p={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

const Mini = ({ l, v }: { l: string; v: string }) => <div className="rounded-2xl bg-petal px-2 py-2.5"><div className="text-[12px] text-muted">{l}</div><div className="font-semibold text-[14px]">{v}</div></div>;

function EditPeriod({ p, onClose }: { p: Period; onClose: () => void }) {
  const s = useStore();
  const [start, setStart] = useState(p.start);
  const [end, setEnd] = useState(p.end ?? '');
  return (
    <Sheet open onClose={onClose} title="Edit period" footer={<div className="flex gap-2">
      <button className="btn-ghost flex-1" onClick={() => { s.set((x) => { x.periods = x.periods.filter((y) => y.id !== p.id); }); toast('Period removed'); onClose(); }}><Trash2 size={16} />Delete</button>
      <button className="btn-primary flex-[2]" onClick={() => { s.set((x) => { const y = x.periods.find((z) => z.id === p.id); if (y) { y.start = start; y.end = end && end >= start ? end : undefined; } }); toast('Saved'); onClose(); }}>Save</button></div>}>
      <Field label="Started"><input type="date" className="field" value={start} max={todayKey()} onChange={(e) => e.target.value && setStart(e.target.value)} /></Field>
      <Field label="Ended (leave empty if ongoing)"><input type="date" className="field" value={end} max={todayKey()} onChange={(e) => setEnd(e.target.value)} /></Field>
    </Sheet>
  );
}
