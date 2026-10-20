import { useState } from 'react';
import { Bike, Check, Dumbbell, Footprints, Moon, Play, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { useToday } from '../lib/derived';
import { DOW_NAMES, addDays, fmtDow, fmtShort, todayKey, uid, weekday } from '../lib/date';
import { EXERCISES, LEVELS, levelOf, readyToLevelUp, startSession, workoutById } from '../lib/workouts';
import type { WorkoutLog } from '../lib/types';
import { Card, Empty, Field, Header, NumberInput, SectionTitle, Segmented, Sheet, toast } from '../components/ui';
import { ExerciseArt } from '../components/Art';
import { unlockAudio } from '../components/WorkoutPlayer';
import { HOME_LABEL } from './Home';

const WALK_LABEL = { walk: '20-minute brisk walk', optional: 'Optional walk', recovery: 'Recovery' };

export default function Workouts() {
  const s = useStore();
  const today = useToday();
  const [tab, setTab] = useState<'today' | 'week' | 'history'>('today');
  const [manual, setManual] = useState(false);
  const [bikeMode, setBikeMode] = useState<'bike-moderate' | 'bike-intervals'>('bike-moderate');
  const sched = s.schedule[weekday(today)];
  const doneToday = (walk: boolean) => s.workouts.some((w) => w.date === today && w.completed && (walk ? w.type === 'walk' : w.type !== 'walk'));

  const start = (id: WorkoutLog['type']) => {
    unlockAudio();
    const def = workoutById(id, s.settings, s.exerciseLevels);
    s.set((st) => { st.session = startSession(def, todayKey(), Date.now()) as any; });
  };
  const quickDone = (id: WorkoutLog['type']) => {
    const def = workoutById(id, s.settings, s.exerciseLevels);
    s.set((st) => { st.workouts.push({ id: uid(), date: today, type: id, name: def.name, plannedMin: def.plannedMin, actualMin: def.plannedMin, completed: true, at: Date.now() }); });
    toast('Marked done ♡');
  };

  const homeId: WorkoutLog['type'] | null = sched.home === 'strength' ? 'strength' : sched.home === 'bike' ? bikeMode : sched.home === 'bike-easy' ? 'bike-easy' : null;
  const homeDef = homeId ? workoutById(homeId, s.settings, s.exerciseLevels) : null;

  return (
    <div>
      <Header eyebrow={DOW_NAMES[weekday(today)]} title="Workouts" />
      <div className="mb-5"><Segmented value={tab} onChange={setTab} options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'Schedule' }, { value: 'history', label: 'History' }]} /></div>

      {tab === 'today' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-petal text-deep grid place-items-center"><Footprints /></div>
              <div className="flex-1">
                <div className="eyebrow">Lunch</div>
                <div className="h-serif text-[24px] leading-tight">{sched.walk === 'walk' ? `${s.settings.walkMinutes}-minute brisk walk` : WALK_LABEL[sched.walk]}</div>
                <div className="text-[14px] text-muted">{sched.walk === 'recovery' ? 'Rest is part of the plan. A gentle stroll is welcome.' : 'Brisk enough to warm up, easy enough to chat.'}</div>
              </div>
            </div>
            {doneToday(true) ? <div className="mt-4 rounded-2xl bg-sage/20 text-sagedeep font-medium px-4 py-3 flex items-center gap-2"><Check size={18} />Walk done today</div> : (
              <div className="flex gap-2 mt-4">
                <button className="btn-primary flex-1" onClick={() => start('walk')}><Play size={18} />Start timer</button>
                <button className="btn-soft flex-1" onClick={() => quickDone('walk')}><Check size={18} />Mark done</button>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-petal text-deep grid place-items-center">{sched.home === 'strength' ? <Dumbbell /> : sched.home === 'rest' ? <Moon /> : <Bike />}</div>
              <div className="flex-1">
                <div className="eyebrow">At home</div>
                <div className="h-serif text-[24px] leading-tight">{homeDef?.name ?? HOME_LABEL.rest}</div>
                <div className="text-[14px] text-muted">{homeDef ? `${homeDef.plannedMin} min · ${homeDef.subtitle}` : 'No workout today — recovery helps you come back stronger.'}</div>
              </div>
            </div>
            {sched.home === 'bike' && (
              <div className="mt-4"><Segmented small value={bikeMode} onChange={setBikeMode} options={[{ value: 'bike-moderate', label: 'Moderate ride' }, { value: 'bike-intervals', label: 'Interval ride' }]} /></div>
            )}
            {homeDef && (
              <>
                <div className="mt-4 rounded-2xl bg-petal p-3 space-y-1">
                  {summarize(homeDef.id).map((l, i) => <div key={i} className="text-[15px] flex justify-between gap-2"><span>{l[0]}</span><span className="text-muted tabular-nums whitespace-nowrap">{l[1]}</span></div>)}
                </div>
                {doneToday(false) ? <div className="mt-4 rounded-2xl bg-sage/20 text-sagedeep font-medium px-4 py-3 flex items-center gap-2"><Check size={18} />Home workout done today</div> : (
                  <div className="flex gap-2 mt-4">
                    <button className="btn-primary flex-1" onClick={() => start(homeDef.id)}><Play size={18} />Start guided</button>
                    <button className="btn-soft flex-1" onClick={() => quickDone(homeDef.id)}><Check size={18} />Mark done</button>
                  </div>
                )}
              </>
            )}
            {!homeDef && (
              <div className="flex gap-2 mt-4">
                <button className="btn-soft flex-1" onClick={() => start('bike-easy')}>Easy ride anyway</button>
                <button className="btn-soft flex-1" onClick={() => start('strength')}>Strength anyway</button>
              </div>
            )}
          </Card>

          <SectionTitle>Your strength moves</SectionTitle>
          <p className="text-[14px] text-muted -mt-1 mb-3">Each move has 5 levels. When you hit every rep and it feels easy for two workouts in a row, I'll suggest the next level — making moves harder over time is what keeps your muscle while you lose fat.</p>
          <div className="space-y-2">
            {['squat', 'pushup', 'hinge', 'knee'].map((id) => {
              const lv = levelOf(s.exerciseLevels, id);
              const info = LEVELS[id][lv];
              const target = id === 'knee' ? 24 : 12;
              const ready = lv < LEVELS[id].length - 1 && readyToLevelUp(s.workouts, id, lv, target);
              const last = [...s.workouts].filter((w) => w.reps?.[id]).sort((a, b) => b.at - a.at)[0];
              return (
                <div key={id} className={`card p-3 ${ready ? 'border-rose' : ''}`}>
                  <div className="flex gap-3 items-center">
                    <div className="w-[64px] h-[64px] rounded-2xl bg-petal grid place-items-center shrink-0"><ExerciseArt id={id} size={56} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] eyebrow">Level {lv + 1} of {LEVELS[id].length}</div>
                      <div className="font-medium">{info.name}</div>
                      <div className="text-[13px] text-muted">{id === 'knee' ? '12 each side' : '12 reps'} × 2 rounds{last ? ` · last time: ${last.reps![id].join(' / ')}` : ''}</div>
                    </div>
                  </div>
                  <p className="text-[14px] mt-2">{info.how}</p>
                  {ready && <div className="mt-2 rounded-2xl bg-petal px-3 py-2 text-[14px]">You’ve nailed this twice — ready for <b>{LEVELS[id][lv + 1].name}</b>?</div>}
                  <div className="flex gap-2 mt-2">
                    {lv > 0 && <button className="btn-ghost btn-sm flex-1" onClick={() => s.set((st) => { st.exerciseLevels[id] = lv - 1; })}>Easier</button>}
                    {lv < LEVELS[id].length - 1 && <button className={`${ready ? 'btn-primary' : 'btn-soft'} btn-sm flex-1`} onClick={() => { s.set((st) => { st.exerciseLevels[id] = lv + 1; }); toast(`Level up: ${LEVELS[id][lv + 1].name} ♡`); }}>Level up</button>}
                  </div>
                </div>
              );
            })}
            <div className="card p-3 flex gap-3 items-center">
              <div className="w-[64px] h-[64px] rounded-2xl bg-petal grid place-items-center shrink-0"><ExerciseArt id="march" size={56} /></div>
              <div><div className="font-medium">{EXERCISES.march.name}</div><div className="text-[13px] text-muted">60 seconds · {EXERCISES.march.how}</div></div>
            </div>
          </div>
          <StepsCard today={today} />
          <p className="text-[14px] text-muted">The timer keeps accurate time even if you lock your phone. iPhone may not play sounds or vibrate while the app is in the background — check back when you’re ready.</p>
        </div>
      )}

      {tab === 'week' && <ScheduleView today={today} />}

      {tab === 'history' && (
        <>
          <button className="btn-soft w-full mb-4" onClick={() => setManual(true)}><Plus size={18} />Log a workout manually</button>
          {s.workouts.length === 0 ? <Empty icon={<Dumbbell />} title="No workouts yet" sub="Your first completed walk or workout will show up here." /> : (
            <div className="space-y-2">
              {[...s.workouts].sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at).map((w) => (
                <div key={w.id} className="card p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full grid place-items-center ${w.completed ? 'bg-sage/25 text-sagedeep' : 'bg-petal text-deep'}`}>{w.type === 'walk' ? <Footprints size={19} /> : w.type === 'strength' ? <Dumbbell size={19} /> : <Bike size={19} />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{w.name}</div>
                    <div className="text-[14px] text-muted">{fmtDow(w.date)} {fmtShort(w.date)} · {w.actualMin} of {w.plannedMin} min · {w.completed ? 'Completed' : 'Partial'}{w.difficulty ? ` · felt ${['easy', 'light', 'good', 'hard', 'max'][w.difficulty - 1]}` : ''}</div>
                  </div>
                  <button aria-label="Delete workout" className="w-10 h-10 grid place-items-center text-muted" onClick={() => s.set((st) => { st.workouts = st.workouts.filter((x) => x.id !== w.id); })}><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {manual && <ManualLog onClose={() => setManual(false)} />}
    </div>
  );
}

function summarize(id: WorkoutLog['type']): [string, string][] {
  if (id === 'strength') return [['Warm-up', '3 min'], ['Squats · wall push-ups · hip hinges · knee-to-elbow · march', '× 2 rounds'], ['Cool-down stretch', 'remaining time']];
  if (id === 'bike-intervals') return [['Easy', '4 min'], ['1 min moderately hard + 2 min easy', '× 4'], ['Easy cool-down', '4 min']];
  if (id === 'bike-moderate') return [['Easy warm-up', '3 min'], ['Moderate riding', 'most of the ride'], ['Easy cool-down', '3 min']];
  return [['Easy, comfortable ride', '20 min']];
}

function ScheduleView({ today }: { today: string }) {
  const s = useStore();
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="card divide-y divide-line">
      {order.map((d) => {
        const sc = s.schedule[d];
        const isToday = weekday(today) === d;
        return (
          <div key={d} className={`p-4 ${isToday ? 'bg-petal/60' : ''}`}>
            <div className="flex justify-between"><div className="font-semibold">{DOW_NAMES[d]}{isToday && <span className="text-deep text-[13px] ml-2">Today</span>}</div></div>
            <div className="text-[15px] text-muted mt-0.5">Lunch: {sc.walk === 'walk' ? `${s.settings.walkMinutes}-minute brisk walk` : WALK_LABEL[sc.walk]} · Home: {HOME_LABEL[sc.home]}</div>
          </div>
        );
      })}
      <p className="p-4 text-[14px] text-muted">Change your schedule anytime in Settings → Exercise schedule.</p>
    </div>
  );
}

function ManualLog({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [type, setType] = useState<WorkoutLog['type']>('walk');
  const [date, setDate] = useState(todayKey());
  const [min, setMin] = useState<number | null>(20);
  const [diff, setDiff] = useState<number | undefined>();
  const names: Record<string, string> = { walk: 'Lunch walk', strength: 'Full-body strength', 'bike-moderate': 'Moderate bike ride', 'bike-intervals': 'Interval bike ride', 'bike-easy': 'Easy bike ride', other: 'Other activity' };
  return (
    <Sheet open onClose={onClose} title="Log a workout" footer={<button className="btn-primary w-full" disabled={!min} onClick={() => {
      s.set((st) => { st.workouts.push({ id: uid(), date, type, name: names[type], plannedMin: type === 'walk' ? s.settings.walkMinutes : s.settings.workoutMinutes, actualMin: min!, completed: true, difficulty: diff, at: Date.now() }); });
      toast('Workout logged ♡'); onClose();
    }}>Save</button>}>
      <Field label="Type"><select className="field" value={type} onChange={(e) => setType(e.target.value as any)}>{Object.entries(names).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Date"><input type="date" className="field" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
      <Field label="Minutes"><NumberInput value={min} onChange={setMin} /></Field>
      <div className="label">How did it feel? (optional)</div>
      <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((d) => <button key={d} onClick={() => setDiff(d)} className={`rounded-2xl py-3 border ${diff === d ? 'bg-deep text-white border-deep' : 'border-line bg-card'}`}>{d}</button>)}</div>
    </Sheet>
  );
}

function StepsCard({ today }: { today: string }) {
  const s = useStore();
  const [val, setVal] = useState<number | null>(s.steps[today] ?? null);
  const days = Array.from({ length: 14 }).map((_, i) => addDays(today, i - 13));
  const max = Math.max(s.settings.stepsGoal, ...days.map((d) => s.steps[d] ?? 0));
  return (
    <>
      <SectionTitle>Steps</SectionTitle>
      <Card>
        <p className="text-[14px] text-muted mb-3">A desk job makes everyday steps extra valuable. Copy today’s count from your iPhone’s Health app.</p>
        <div className="flex gap-2">
          <div className="flex-1"><NumberInput value={val} onChange={setVal} placeholder={`Goal ${s.settings.stepsGoal.toLocaleString()}`} ariaLabel="Steps today" /></div>
          <button className="btn-primary" onClick={() => { if (val == null) return; s.set((st) => { st.steps[today] = Math.round(val); }); toast('Steps saved'); }}>Save</button>
        </div>
        <div className="flex items-end gap-1 h-24 mt-4" aria-label="Steps, last 14 days">
          {days.map((d) => {
            const v = s.steps[d] ?? 0;
            return <div key={d} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full rounded-t-md" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 4 : 2, background: v >= s.settings.stepsGoal ? 'var(--sage)' : v ? 'var(--rose)' : 'var(--petal)' }} />
            </div>;
          })}
        </div>
        <div className="flex justify-between text-[12px] text-muted mt-1"><span>{fmtShort(days[0])}</span><span>Today</span></div>
      </Card>
    </>
  );
}
