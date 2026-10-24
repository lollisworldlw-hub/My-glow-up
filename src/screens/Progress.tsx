import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CalendarDays, Image as ImageIcon, Pencil, Plus, Ruler, Scale, Trash2, Trophy } from 'lucide-react';
import {
  CartesianGrid, ComposedChart, ReferenceArea, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis, BarChart, Bar as RBar
} from 'recharts';
import { useStore } from '../lib/store';
import { MEASURES } from '../lib/types';
import type { MeasureKey, Pose } from '../lib/types';
import { addDays, fmtDow, fmtShort, fromKey, todayKey, uid, weekDays, weekStart, toKey } from '../lib/date';
import { changeOver, latest, progress, rollingAverage, sortWeights, weekAverage, lbToKg } from '../lib/weight';
import { dayHabitStats, habitApplies, habitAuto, habitDone, useToday } from '../lib/derived';
import { Bar, Card, CheckRow, Empty, Field, Header, NumberInput, SectionTitle, Segmented, Sheet, toast } from '../components/ui';
import { MILESTONES, WeightSheet, showW, wNum } from '../components/WeightSheet';
import { deletePhoto, loadPhoto, resizeImage, savePhoto } from '../lib/backup';
import { useUI } from '../lib/ui';
import { CycleView } from '../components/CycleView';
import { CheckinSheet } from '../components/Checkin';
import { sortPeriods } from '../lib/cycle';

type Sub = 'weight' | 'body' | 'photos' | 'habits' | 'cycle' | 'milestones';

export default function Progress() {
  const sub = (useUI((u) => u.sub.progress) ?? 'weight') as Sub;
  const setSub = useUI((u) => u.setSub);
  return (
    <div>
      <Header eyebrow="Gentle, honest tracking" title="Progress" />
      <div className="mb-3">
        <Segmented small value={sub} onChange={(v) => setSub('progress', v)} options={[
          { value: 'weight', label: 'Weight' }, { value: 'body', label: 'Body' }, { value: 'photos', label: 'Photos' },
          { value: 'habits', label: 'Habits' }, { value: 'cycle', label: 'Cycle' }, { value: 'milestones', label: 'Goals' }]} />
      </div>
      {sub === 'weight' && <WeightView />}
      {sub === 'body' && <BodyView />}
      {sub === 'photos' && <PhotosView />}
      {sub === 'habits' && <HabitsView />}
      {sub === 'cycle' && <CycleView />}
      {sub === 'milestones' && <MilestonesView />}
    </div>
  );
}

const fmtChange = (n: number | null, unit: 'lb' | 'kg') => n == null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(unit === 'kg' ? +lbToKg(n).toFixed(1) : n)} ${unit === 'kg' ? 'kg' : 'lb'}`;

function WeightView() {
  const s = useStore();
  const today = useToday();
  const [range, setRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [sheet, setSheet] = useState<string | null | 'new'>(null);
  const st = s.settings;
  const u = st.weightUnit;
  const sorted = sortWeights(s.weights);
  const cur = latest(s.weights)?.lbs ?? st.startWeight;
  const p = progress(st.startWeight, st.goalWeight, cur);
  const thisWeek = weekAverage(s.weights, today);
  const lastWeek = weekAverage(s.weights, addDays(today, -7));

  const data = useMemo(() => {
    const from = range === 'all' ? '0000' : addDays(today, -Number(range) + 1);
    const avg = rollingAverage(s.weights);
    return sorted.filter((w) => w.date >= from).map((w) => ({
      t: fromKey(w.date).getTime(), w: wNum(w.lbs, u), avg: wNum(avg.find((a) => a.date === w.date)!.avg, u)
    }));
  }, [s.weights, range, today, u]);
  const goal = wNum(st.goalWeight, u);
  const start = wNum(st.startWeight, u);
  const vals = data.map((d) => d.w);
  // honest scale: always shows the full journey from goal to start
  const yMin = Math.floor(Math.min(goal, ...vals) - 2);
  const yMax = Math.ceil(Math.max(start, ...vals) + 2);

  return (
    <div className="space-y-2">
      <Card>
        <div className="flex justify-between items-start">
          <div><div className="eyebrow">Current</div><div className="h-serif text-[24px] leading-none mt-1">{showW(cur, u)}</div></div>
          <button className="btn-primary btn-sm" onClick={() => setSheet('new')}><Plus size={16} />Weigh-in</button>
        </div>
        <div className="mt-3"><Bar pct={p.pct} h={12} /></div>
        <div className="text-[13px] text-muted mt-1.5">{Math.round(p.pct)}% of the way to {showW(st.goalWeight, u)}</div>
        <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center">
          <Mini label="Lost" value={showW(Math.max(0, p.lost), u)} />
          <Mini label="To go" value={showW(p.remaining, u)} />
          <Mini label="Weigh-ins" value={String(s.weights.length)} />
          <Mini label="This week avg" value={thisWeek ? showW(thisWeek, u) : '—'} />
          <Mini label="Last week avg" value={lastWeek ? showW(lastWeek, u) : '—'} />
          <Mini label="7 days" value={fmtChange(changeOver(s.weights, 7, today), u)} />
          <Mini label="30 days" value={fmtChange(changeOver(s.weights, 30, today), u)} />
          <Mini label="90 days" value={fmtChange(changeOver(s.weights, 90, today), u)} />
          <Mini label="Since start" value={fmtChange(s.weights.length ? +(cur - st.startWeight).toFixed(1) : null, u)} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3"><div className="eyebrow">Trend</div></div>
        <Segmented small value={range} onChange={setRange} options={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }, { value: 'all', label: 'All' }]} />
        {data.length === 0 ? <Empty icon={<Scale />} title="No weigh-ins here yet" sub="Your chart fills in as you log. Weekly averages smooth out daily ups and downs." /> : (
          <div className="h-[260px] mt-3 -ml-3">
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} padding={{ left: 12, right: 12 }}
                  tickFormatter={(t) => fmtShort(toKey(new Date(t)))} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--line)" minTickGap={28} />
                <YAxis domain={[yMin, yMax]} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--line)" width={40} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14 }}
                  labelFormatter={(t) => fmtShort(toKey(new Date(t as number)))} formatter={(v: any, n: any) => [`${v} ${u === 'kg' ? 'kg' : 'lb'}`, n === 'w' ? 'Weigh-in' : '7-day average']} />
                {sortPeriods(s.periods).map((p) => {
                  const x1 = fromKey(p.start).getTime(), x2 = fromKey(p.end ?? addDays(p.start, 4)).getTime();
                  if (!data.length || x2 < data[0].t || x1 > data[data.length - 1].t) return null;
                  return <ReferenceArea key={p.id} x1={Math.max(x1, data[0].t)} x2={Math.min(x2, data[data.length - 1].t)} fill="var(--blush)" fillOpacity={0.25} strokeOpacity={0} ifOverflow="hidden" />;
                })}
                <ReferenceLine y={goal} stroke="var(--sage)" strokeDasharray="5 5" label={{ value: 'Goal', fill: 'var(--sage-deep)', fontSize: 12, position: 'insideBottomRight' }} />
                <Line dataKey="avg" stroke="var(--rose-deep)" strokeWidth={2.5} dot={false} type="monotone" isAnimationActive />
                <Scatter dataKey="w" fill="var(--blush)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex gap-4 text-[13px] text-muted mt-2"><span><span className="inline-block w-2.5 h-2.5 rounded-full bg-blush mr-1" />Weigh-ins</span><span><span className="inline-block w-4 h-0.5 bg-deep align-middle mr-1" />7-day average</span><span><span className="inline-block w-4 border-t border-dashed border-sage align-middle mr-1" />Goal</span>{s.periods.length > 0 && <span><span className="inline-block w-3 h-3 rounded-sm bg-blush/50 align-middle mr-1" />Period</span>}</div>
      </Card>

      {sorted.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 pt-4 pb-2 eyebrow">History</div>
          {[...sorted].reverse().map((w) => (
            <button key={w.id} className="w-full flex justify-between items-center px-4 py-2 border-t border-line text-left" onClick={() => setSheet(w.id)}>
              <span>{fmtDow(w.date)} {fmtShort(w.date)}</span><span className="font-medium tabular-nums flex items-center gap-2">{showW(w.lbs, u)}<Pencil size={14} className="text-muted" /></span>
            </button>
          ))}
        </Card>
      )}
      {sheet && <WeightSheet entryId={sheet === 'new' ? undefined : sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-petal px-1.5 py-1"><div className="text-[10.5px] text-muted leading-tight">{label}</div><div className="font-semibold text-[13px] tabular-nums leading-snug">{value}</div></div>
);

const toLen = (inch: number, u: 'in' | 'cm') => (u === 'cm' ? +(inch * 2.54).toFixed(1) : +inch.toFixed(2));

function BodyView() {
  const s = useStore();
  const [key, setKey] = useState<MeasureKey>('waistNavel');
  const [sheet, setSheet] = useState<string | null | 'new'>(null);
  const u = s.settings.lengthUnit;
  const sorted = [...s.measures].sort((a, b) => a.date.localeCompare(b.date));
  const series = sorted.filter((m) => m.values[key] != null).map((m) => ({ t: fromKey(m.date).getTime(), v: toLen(m.values[key]!, u) }));
  const first = series[0]?.v, last = series[series.length - 1]?.v;
  return (
    <div className="space-y-2">
      <button className="btn-primary w-full" onClick={() => setSheet('new')}><Ruler size={18} />Add measurements</button>
      <Card>
        <Field label="Show">
          <select className="field" value={key} onChange={(e) => setKey(e.target.value as MeasureKey)}>{MEASURES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
        </Field>
        {series.length === 0 ? <Empty icon={<Ruler />} title="No measurements yet" sub="Measure every 2–4 weeks, same time of day. Your waistline often changes even when the scale doesn’t." /> : (
          <>
            <div className="flex gap-2 mb-2">
              <Mini label="Latest" value={`${last} ${u}`} />
              <Mini label="Change since first" value={series.length > 1 ? `${(last! - first!) > 0 ? '+' : ''}${(last! - first!).toFixed(1)} ${u}` : '—'} />
            </div>
            <div className="h-[220px] -ml-3">
              <ResponsiveContainer>
                <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} padding={{ left: 12, right: 12 }} tickFormatter={(t) => fmtShort(toKey(new Date(t)))} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--line)" minTickGap={28} />
                  <YAxis domain={[(d: number) => Math.floor(d - 2), (d: number) => Math.ceil(d + 2)]} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--line)" width={40} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14 }} labelFormatter={(t) => fmtShort(toKey(new Date(t as number)))} formatter={(v: any) => [`${v} ${u}`, MEASURES.find((m) => m.key === key)!.label]} />
                  <Line dataKey="v" stroke="var(--rose-deep)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--blush)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>
      {sorted.length > 0 && (
        <div className="space-y-2">
          {[...sorted].reverse().map((m) => (
            <button key={m.id} className="card p-3 w-full text-left" onClick={() => setSheet(m.id)}>
              <div className="font-medium mb-1 flex justify-between">{fmtDow(m.date)} {fmtShort(m.date)}<Pencil size={14} className="text-muted" /></div>
              <div className="text-[13px] text-muted">{MEASURES.filter((x) => m.values[x.key] != null).map((x) => `${x.label.replace(' (optional)', '')} ${toLen(m.values[x.key]!, u)}`).join(' · ')}</div>
            </button>
          ))}
        </div>
      )}
      {sheet && <MeasureSheet id={sheet === 'new' ? undefined : sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

function MeasureSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const s = useStore();
  const u = s.settings.lengthUnit;
  const ex = id ? s.measures.find((m) => m.id === id) : undefined;
  const [date, setDate] = useState(ex?.date ?? todayKey());
  const [vals, setVals] = useState<Partial<Record<MeasureKey, number | null>>>(() => Object.fromEntries(Object.entries(ex?.values ?? {}).map(([k, v]) => [k, toLen(v!, u)])));
  const save = () => {
    const values: Partial<Record<MeasureKey, number>> = {};
    for (const [k, v] of Object.entries(vals)) if (v != null && v > 0) values[k as MeasureKey] = u === 'cm' ? v / 2.54 : v;
    if (!Object.keys(values).length) return;
    s.set((st) => {
      if (ex) { const e = st.measures.find((m) => m.id === ex.id)!; e.date = date; e.values = values; }
      else st.measures.push({ id: uid(), date, values });
    });
    toast('Measurements saved'); onClose();
  };
  return (
    <Sheet open onClose={onClose} title={ex ? 'Edit measurements' : 'Add measurements'} footer={<div className="flex gap-2">
      {ex && <button className="btn-ghost flex-1" onClick={() => { s.set((st) => { st.measures = st.measures.filter((m) => m.id !== ex.id); }); onClose(); }}>Delete</button>}
      <button className="btn-primary flex-[2]" onClick={save}>Save</button></div>}>
      <Field label="Date"><input type="date" className="field" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
      <p className="text-[13px] text-muted mb-3">In {u === 'cm' ? 'centimeters' : 'inches'}. Fill in any you like — skip the rest.</p>
      <div className="grid grid-cols-2 gap-x-3">
        {MEASURES.map((m) => <Field key={m.key} label={m.label}><NumberInput value={vals[m.key] ?? null} onChange={(v) => setVals({ ...vals, [m.key]: v })} ariaLabel={m.label} /></Field>)}
      </div>
    </Sheet>
  );
}

function usePhotoUrl(id?: string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let u: string | undefined; let alive = true;
    if (id) loadPhoto(id).then((b) => { if (b && alive) { u = URL.createObjectURL(b); setUrl(u); } });
    return () => { alive = false; if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url;
}
function Photo({ id, className = '' }: { id?: string; className?: string }) {
  const url = usePhotoUrl(id);
  return url ? <img src={url} alt="" className={`object-cover ${className}`} /> : <div className={`bg-petal ${className}`} />;
}

const POSES: { value: Pose; label: string }[] = [{ value: 'front', label: 'Front' }, { value: 'side', label: 'Side' }, { value: 'back', label: 'Back' }, { value: 'face', label: 'Face/neck' }];

function PhotosView() {
  const s = useStore();
  const [pose, setPose] = useState<Pose>('front');
  const [date, setDate] = useState(todayKey());
  const [mode, setMode] = useState<'side' | 'slider'>('slider');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const list = s.photos.filter((p) => p.pose === pose).sort((a, b) => a.date.localeCompare(b.date));
  const [a, setA] = useState<string>();
  const [b, setB] = useState<string>();
  const A = list.find((p) => p.id === a) ?? list[0];
  const B = list.find((p) => p.id === b) ?? list[list.length - 1];
  const [pos, setPos] = useState(50);

  const upload = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const { blob, w, h } = await resizeImage(f);
      const id = uid();
      await savePhoto(id, blob);
      s.set((st) => { st.photos.push({ id, date, pose, w, h }); });
      toast('Photo saved privately on this device');
    } catch { toast('That photo couldn’t be read — try another'); }
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <Card>
        <div className="text-[13px] text-muted mb-3">Photos stay on this iPhone only — never uploaded anywhere. Include them in backups if you want to keep them.</div>
        <Segmented small value={pose} onChange={setPose} options={POSES} />
        <div className="flex gap-2 mt-3 items-end">
          <div className="flex-1"><span className="label">Photo date</span><input type="date" className="field" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} /></div>
          <button className="btn-primary" disabled={busy} onClick={() => fileRef.current?.click()}><Camera size={18} />{busy ? 'Saving…' : 'Add'}</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </Card>

      {list.length >= 2 && A && B && (
        <Card>
          <div className="flex items-center justify-between mb-3"><div className="eyebrow">Compare</div><Segmented small value={mode} onChange={setMode} options={[{ value: 'slider', label: 'Slider' }, { value: 'side', label: 'Side by side' }]} /></div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select className="field" value={A.id} onChange={(e) => setA(e.target.value)} aria-label="Before photo">{list.map((p) => <option key={p.id} value={p.id}>{fmtShort(p.date)}</option>)}</select>
            <select className="field" value={B.id} onChange={(e) => setB(e.target.value)} aria-label="After photo">{list.map((p) => <option key={p.id} value={p.id}>{fmtShort(p.date)}</option>)}</select>
          </div>
          {mode === 'side' ? (
            <div className="grid grid-cols-2 gap-2">
              {[A, B].map((p) => <div key={p.id}><Photo id={p.id} className="w-full aspect-[3/4] rounded-2xl" /><div className="text-center text-[13px] text-muted mt-1">{fmtShort(p.date)}</div></div>)}
            </div>
          ) : (
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden select-none">
              <Photo id={B.id} className="absolute inset-0 w-full h-full" />
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}><Photo id={A.id} className="absolute inset-0 w-full h-full" /></div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
              <span className="absolute top-2 left-2 text-[12px] bg-black/40 text-white rounded-full px-2 py-0.5">{fmtShort(A.date)}</span>
              <span className="absolute top-2 right-2 text-[12px] bg-black/40 text-white rounded-full px-2 py-0.5">{fmtShort(B.date)}</span>
              <input aria-label="Compare slider" type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} className="absolute inset-x-3 bottom-3 accent-[var(--rose-deep)]" />
            </div>
          )}
        </Card>
      )}

      {list.length === 0 ? <Empty icon={<ImageIcon />} title={`No ${pose} photos yet`} sub="Same spot, same lighting, every few weeks makes comparisons easy." /> : (
        <div className="grid grid-cols-3 gap-2">
          {[...list].reverse().map((p) => (
            <button key={p.id} onClick={() => setView(p.id)} className="relative"><Photo id={p.id} className="w-full aspect-[3/4] rounded-2xl" /><span className="absolute bottom-1.5 left-1.5 text-[12px] bg-black/40 text-white rounded-full px-2">{fmtShort(p.date)}</span></button>
          ))}
        </div>
      )}
      {view && (
        <Sheet open onClose={() => setView(null)} title={fmtShort(s.photos.find((p) => p.id === view)?.date ?? todayKey())} footer={
          <button className="btn-ghost w-full" onClick={async () => { await deletePhoto(view); s.set((st) => { st.photos = st.photos.filter((p) => p.id !== view); }); setView(null); toast('Photo deleted'); }}><Trash2 size={16} />Delete photo</button>}>
          <Photo id={view} className="w-full rounded-2xl" />
        </Sheet>
      )}
    </div>
  );
}

function HabitsView() {
  const s = useStore();
  const today = useToday();
  const [edit, setEdit] = useState(false);
  const [month, setMonth] = useState(today.slice(0, 7));
  const ws = weekStart(today);
  const week = weekDays(ws);
  const stats = dayHabitStats(s, today);

  const toggle = (id: string, date: string) => {
    const h = s.habits.find((x) => x.id === id)!;
    if (habitAuto(s, h, date) && !s.habitChecks[date]?.[id]) { toast('This one checks itself from your logs'); return; }
    s.set((x) => { x.habitChecks[date] ??= {}; x.habitChecks[date][id] = !x.habitChecks[date][id]; });
  };

  // days with any activity since starting
  const start = s.settings.startDate;
  const allDays: string[] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) allDays.push(d);
  const pctFor = (d: string) => { const x = dayHabitStats(s, d); return x.total ? x.done / x.total : 0; };
  const showedUp = allDays.filter((d) => dayHabitStats(s, d).done + dayHabitStats(s, d).bonus > 0).length;
  let streak = 0;
  for (let d = today; d >= start; d = addDays(d, -1)) { const x = dayHabitStats(s, d); if (x.done + x.bonus > 0) streak++; else if (d !== today) break; }
  const weekPct = Math.round((week.filter((d) => d <= today).reduce((a, d) => a + pctFor(d), 0) / Math.max(1, week.filter((d) => d <= today).length)) * 100);

  const trend = Array.from({ length: 8 }).map((_, i) => {
    const m = addDays(ws, -7 * (7 - i));
    const ds = weekDays(m).filter((d) => d <= today && d >= start);
    return { label: fmtShort(m), pct: ds.length ? Math.round(ds.reduce((a, d) => a + pctFor(d), 0) / ds.length * 100) : 0 };
  });

  const [y, mo] = month.split('-').map(Number);
  const first = new Date(y, mo - 1, 1, 12);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const lead = (first.getDay() + 6) % 7;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Mini label="Today" value={`${stats.done}/${stats.total}`} />
        <Mini label="This week" value={`${weekPct}%`} />
        <Mini label="Days showing up" value={String(showedUp)} />
      </div>
      <p className="text-[13px] text-muted -mt-1">{streak > 1 ? `${streak} days in a row with at least one habit. ` : ''}Missed a day? It doesn’t erase anything — every day you show up still counts.</p>

      <Card>
        <div className="flex items-center justify-between"><div className="eyebrow">Today</div><button className="text-deep text-[14px] font-medium" onClick={() => setEdit(true)}>Edit habits</button></div>
        <div className="divide-y divide-line">
          {stats.habits.map((h) => <CheckRow key={h.id} on={habitDone(s, h, today)} onToggle={() => toggle(h.id, today)} title={h.name} sub={h.optional ? 'Optional' : undefined} />)}
        </div>
        <SectionTitle>Reflection</SectionTitle>
        <textarea className="field py-2 min-h-[90px]" placeholder="How are you feeling today? What went well?" value={s.notes[today] ?? ''} onChange={(e) => s.set((x) => { x.notes[today] = e.target.value; })} />
      </Card>

      <Card className="!px-3">
        <div className="eyebrow px-2 mb-2">This week</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead><tr><th className="text-left font-medium text-muted px-2 pb-2">Habit</th>{week.map((d) => <th key={d} className={`font-medium pb-2 ${d === today ? 'text-deep' : 'text-muted'}`}>{fmtDow(d).slice(0, 2)}</th>)}</tr></thead>
            <tbody>
              {s.habits.map((h) => (
                <tr key={h.id}>
                  <td className="px-2 py-1.5 max-w-[120px] truncate">{h.name}</td>
                  {week.map((d) => {
                    const ap = habitApplies(s, h, d);
                    const on = habitDone(s, h, d);
                    return <td key={d} className="text-center py-1.5">{ap ? <button aria-label={`${h.name} ${d}`} disabled={d > today} onClick={() => toggle(h.id, d)} className={`w-7 h-7 rounded-full border ${on ? 'bg-sage border-sage' : 'border-blush'} ${d > today ? 'opacity-40' : ''}`} /> : <span className="text-line">·</span>}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <button aria-label="Previous month" className="w-10 h-10 rounded-full bg-petal text-deep" onClick={() => { const d = new Date(y, mo - 2, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}>‹</button>
          <div className="font-semibold flex items-center gap-2"><CalendarDays size={16} />{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button aria-label="Next month" className="w-10 h-10 rounded-full bg-petal text-deep" onClick={() => { const d = new Date(y, mo, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }}>›</button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[12px] text-muted mb-1">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: lead }).map((_, i) => <div key={'l' + i} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = `${month}-${String(i + 1).padStart(2, '0')}`;
            const future = d > today || d < start;
            const pct = future ? 0 : pctFor(d);
            return (
              <div key={d} className={`aspect-square rounded-xl grid place-items-center text-[13px] ${d === today ? 'ring-2 ring-rose' : ''}`}
                style={{ background: future ? 'transparent' : pct === 0 ? 'var(--petal)' : `color-mix(in srgb, var(--rose) ${Math.round(25 + pct * 75)}%, var(--petal))`, color: pct > 0.5 ? '#fff' : 'var(--ink)', opacity: future ? 0.4 : 1 }}>
                {i + 1}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="eyebrow mb-2">Weekly consistency</div>
        <div className="h-[170px] -ml-3">
          <ResponsiveContainer>
            <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--line)" interval={1} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--line)" width={36} unit="%" />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14 }} formatter={(v: any) => [`${v}%`, 'Habits done']} />
              <RBar dataKey="pct" fill="var(--rose)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      {edit && <HabitEditor onClose={() => setEdit(false)} />}
    </div>
  );
}

function HabitEditor({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [name, setName] = useState('');
  return (
    <Sheet open onClose={onClose} title="Edit habits">
      <div className="space-y-2 mb-3">
        {s.habits.map((h) => (
          <div key={h.id} className="card p-3">
            <div className="flex gap-2 items-center">
              <input className="field flex-1" value={h.name} aria-label="Habit name" onChange={(e) => s.set((st) => { st.habits.find((x) => x.id === h.id)!.name = e.target.value; })} />
              <button aria-label="Delete habit" className="w-10 h-10 grid place-items-center text-muted" onClick={() => s.set((st) => { st.habits = st.habits.filter((x) => x.id !== h.id); })}><Trash2 size={18} /></button>
            </div>
            <div className="flex gap-4 mt-2 text-[13px]">
              <label className="flex items-center gap-2"><input type="checkbox" className="w-5 h-5 accent-[var(--rose-deep)]" checked={h.home} onChange={(e) => s.set((st) => { st.habits.find((x) => x.id === h.id)!.home = e.target.checked; })} />On Home</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="w-5 h-5 accent-[var(--rose-deep)]" checked={h.optional} onChange={(e) => s.set((st) => { st.habits.find((x) => x.id === h.id)!.optional = e.target.checked; })} />Optional</label>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="field flex-1" placeholder="New habit, e.g. Stretch 5 min" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary" disabled={!name.trim()} onClick={() => { s.set((st) => { st.habits.push({ id: uid(), name: name.trim(), rule: 'daily', optional: false, home: true }); }); setName(''); }}><Plus size={18} /></button>
      </div>
    </Sheet>
  );
}

function MilestonesView() {
  const s = useStore();
  const today = useToday();
  const [open, setOpen] = useState<string | null>(null);
  const sorted = sortWeights(s.weights);
  const u = s.settings.weightUnit;
  const ms = MILESTONES.filter((m) => m >= s.settings.goalWeight - 0.01 && m < s.settings.startWeight);
  const thisWeek = weekStart(today);
  const checks = [...s.checkins].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {ms.map((m) => {
          const hit = sorted.find((w) => w.lbs <= m);
          return (
            <div key={m} className={`card p-3 text-center ${hit ? 'bg-petal border-blush' : ''}`}>
              <div className={`mx-auto w-12 h-12 rounded-full grid place-items-center mb-2 ${hit ? 'bg-deep text-white' : 'bg-petal text-blush'}`}><Trophy size={20} /></div>
              <div className="h-serif text-[18px]">{showW(m, u)}</div>
              <div className="text-[13px] text-muted">{hit ? `Reached ${fmtShort(hit.date)}` : m === s.settings.goalWeight ? 'Your goal' : 'Ahead of you'}</div>
            </div>
          );
        })}
        <p className="col-span-2 text-[13px] text-muted">No deadlines — milestones arrive when they arrive.</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2"><h3 className="h-serif text-[15px]">Weekly check-ins</h3>
          <button className="btn-soft btn-sm" onClick={() => setOpen(thisWeek)}>This week</button></div>
        {checks.length === 0 ? <p className="text-[14px] text-muted">Your Sunday check-ins will collect here — a lovely record of how far you’ve come.</p> : (
          <div className="space-y-2">
            {checks.map((c) => (
              <button key={c.weekStart} className="card p-3 w-full text-left" onClick={() => setOpen(c.weekStart)}>
                <div className="font-medium">Week of {fmtShort(c.weekStart)}</div>
                {c.wins && <div className="text-[13px]"><span className="text-muted">Wins:</span> {c.wins}</div>}
                {c.focus && <div className="text-[13px]"><span className="text-muted">Focus:</span> {c.focus}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
      {open && <CheckinSheet monday={open} today={today} onClose={() => setOpen(null)} />}
    </div>
  );
}
