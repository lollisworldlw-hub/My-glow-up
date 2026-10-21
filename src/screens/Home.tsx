import { useEffect, useState } from 'react';
import { Droplet, Footprints, Plus, Scale, Sparkles, Trash2, Bike, Dumbbell, Moon } from 'lucide-react';
import { useStore } from '../lib/store';
import { SLOTS } from '../lib/types';
import { consumed, dayHabitStats, habitAuto, habitDone, planned, useToday } from '../lib/derived';
import { fmtLong, greeting, weekStart, daysBetween, weekday } from '../lib/date';
import { MOTIVATION } from '../lib/seed';
import { latest, progress } from '../lib/weight';
import { Bar, Card, CheckRow, Ring, SectionTitle, toast } from '../components/ui';
import { LogFoodSheet, MealCard, SwapSheet } from '../components/MealParts';
import { WeightSheet, showW } from '../components/WeightSheet';
import { useUI } from '../lib/ui';
import { CheckReminders, CheckinCard, CycleChip, DessertBudget, LogDayButton, ProteinFixer } from '../components/HomeExtras';

export const HOME_LABEL: Record<string, string> = { strength: 'Full-body strength', bike: 'Stationary bike', 'bike-easy': 'Easy bike (optional)', rest: 'Rest & recover' };

export default function Home() {
  const s = useStore();
  const today = useToday();
  const go = useUI((u) => u.go);
  const [sheet, setSheet] = useState<null | 'weight' | 'log' | 'add-dessert'>(null);
  useEffect(() => { s.ensureWeek(weekStart(today)); }, [today]);

  const st = s.settings;
  const cur = latest(s.weights)?.lbs ?? st.startWeight;
  const p = progress(st.startWeight, st.goalWeight, cur);
  const eaten = consumed(s, today);
  const plan = planned(s, today);
  const calPct = (eaten.cal / st.calTarget) * 100;
  const day = s.plans[today];
  const habits = dayHabitStats(s, today, true);
  const sched = s.schedule[weekday(today)];
  const water = s.water[today] ?? 0;
  const extras = s.logs.filter((l) => l.date === today && !l.planItemId);
  const quotes = st.quotes.filter((q) => q.trim()).length ? st.quotes.filter((q) => q.trim()) : MOTIVATION;
  const msg = quotes[(daysBetween('2026-01-01', today) % quotes.length + quotes.length) % quotes.length];
  const proteinLeft = Math.max(0, st.proteinMin - eaten.protein);

  const toggleHabit = (id: string) => {
    const h = s.habits.find((x) => x.id === id)!;
    if (habitAuto(s, h, today) && !s.habitChecks[today]?.[id]) { toast('This one checks itself from your logs ♡'); return; }
    s.set((x) => { x.habitChecks[today] ??= {}; x.habitChecks[today][id] = !x.habitChecks[today][id]; });
  };

  return (
    <div className="space-y-4">
      <div className="rise pt-1">
        <h1 className="h-serif text-[34px] leading-[1.1]">{greeting()}{st.name ? `, ${st.name}` : ''} <span className="text-rose">♡</span></h1>
        <div className="text-muted mt-1">{fmtLong(today)}</div>
        <p className="mt-3 font-serif italic text-[20px] text-deep">“{msg}”</p>
      </div>

      <CheckinCard today={today} />
      <CycleChip today={today} />

      {/* weight card */}
      <Card className="rise">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="eyebrow">Weight journey</div>
            <div className="h-serif text-[34px] leading-none mt-1">{showW(cur, st.weightUnit)}</div>
            <div className="text-[14px] text-muted mt-1">{s.weights.length ? 'Most recent weigh-in' : 'Starting weight — log your first weigh-in'}</div>
          </div>
          <button className="btn-soft btn-sm" onClick={() => setSheet('weight')}><Scale size={16} />Log</button>
        </div>
        <Bar pct={p.pct} h={12} />
        <div className="flex justify-between text-[13px] text-muted mt-1.5"><span>Start {showW(st.startWeight, st.weightUnit)}</span><span>{Math.round(p.pct)}%</span><span>Goal {showW(st.goalWeight, st.weightUnit)}</span></div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-2xl bg-petal p-3"><div className="text-[13px] text-muted">Lost so far</div><div className="font-semibold text-[20px]">{showW(Math.max(0, p.lost), st.weightUnit)}</div></div>
          <div className="rounded-2xl bg-petal p-3"><div className="text-[13px] text-muted">To go</div><div className="font-semibold text-[20px]">{showW(p.remaining, st.weightUnit)}</div></div>
        </div>
      </Card>

      {/* calorie ring */}
      <Card className="rise">
        <div className="eyebrow mb-3">Today’s nourishment</div>
        <div className="flex items-center gap-5">
          <Ring pct={calPct} ghostPct={(plan.cal / st.calTarget) * 100} size={148}>
            <div>
              <div className="text-[30px] font-semibold leading-none tabular-nums">{Math.round(eaten.cal)}</div>
              <div className="text-[13px] text-muted">of {st.calTarget} cal</div>
            </div>
          </Ring>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="text-[13px] text-muted">Remaining to plan</div>
              <div className="font-semibold text-[20px] tabular-nums">{Math.max(0, Math.round(st.calTarget - eaten.cal))} cal</div>
            </div>
            <div>
              <div className="flex justify-between text-[13px] text-muted"><span>Protein</span><span className="tabular-nums">{Math.round(eaten.protein)} / {st.proteinMin} g</span></div>
              <Bar pct={(eaten.protein / st.proteinMin) * 100} color="var(--sage)" />
              <div className="text-[13px] text-muted mt-1">{proteinLeft > 0 ? `${Math.round(proteinLeft)} g to go` : 'Protein goal met ♡'}</div>
            </div>
          </div>
        </div>
        <div className="text-[13px] text-muted mt-3">Planned today: ≈ {Math.round(plan.cal)} cal · {Math.round(plan.protein)} g protein (lighter ring). Flexible range {st.calMin}–{st.calMax}.</div>
        <ProteinFixer today={today} />
      </Card>

      {/* water */}
      <Card className="rise">
        <div className="flex items-center justify-between mb-3">
          <div className="eyebrow">Water</div>
          <div className="text-[14px] text-muted tabular-nums">{water} / {st.waterTarget} glasses</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: Math.max(st.waterTarget, water) }).map((_, i) => (
            <button key={i} aria-label={`Glass ${i + 1}`} onClick={() => s.set((x) => { x.water[today] = i < water ? i : i + 1; })}
              className={`w-10 h-11 rounded-xl grid place-items-center transition ${i < water ? 'bg-rose text-white' : 'bg-petal text-blush'}`}>
              <Droplet size={18} fill={i < water ? 'currentColor' : 'none'} />
            </button>
          ))}
          <button aria-label="Add a glass" className="w-10 h-11 rounded-xl grid place-items-center border border-dashed border-blush text-deep" onClick={() => s.set((x) => { x.water[today] = water + 1; })}><Plus size={18} /></button>
        </div>
      </Card>

      {/* workout today */}
      <Card className="rise" onClick={() => go('workouts')}>
        <div className="eyebrow mb-3">Today’s movement</div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-petal grid place-items-center text-deep"><Footprints size={20} /></div>
          <div><div className="font-medium">{sched?.walk === 'walk' ? `${st.walkMinutes}-minute brisk lunch walk` : sched?.walk === 'optional' ? 'Optional walk' : 'Recovery day'}</div>
            <div className="text-[14px] text-muted">{s.workouts.some((w) => w.date === today && w.type === 'walk' && w.completed) ? 'Done ♡' : 'Lunch break'}</div></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-petal grid place-items-center text-deep">{sched?.home === 'strength' ? <Dumbbell size={20} /> : sched?.home === 'rest' ? <Moon size={20} /> : <Bike size={20} />}</div>
          <div className="flex-1"><div className="font-medium">{HOME_LABEL[sched?.home ?? 'rest']}</div>
            <div className="text-[14px] text-muted">{s.workouts.some((w) => w.date === today && w.type !== 'walk' && w.completed) ? 'Done ♡' : sched?.home === 'rest' ? 'Enjoy the rest' : `${st.workoutMinutes} minutes at home`}</div></div>
          <span className="text-deep font-medium text-[15px]">Open →</span>
        </div>
        <div className="mt-3 text-[14px] text-muted">Steps today: <b className="text-ink">{(s.steps[today] ?? 0).toLocaleString()}</b> of {st.stepsGoal.toLocaleString()}</div>
      </Card>

      {/* checklist */}
      <Card className="rise">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Today’s checklist</div>
          <Sparkles size={18} className="text-rose" />
        </div>
        <div className="h-serif text-[24px] mt-1 mb-1">
          {habits.done === habits.total && habits.total > 0 ? 'Every habit done — beautiful work!' : `${habits.done} of ${habits.total} daily habits completed!`}
        </div>
        <div className="divide-y divide-line">
          {habits.habits.map((h) => (
            <CheckRow key={h.id} on={habitDone(s, h, today)} onToggle={() => toggleHabit(h.id)}
              title={h.name} sub={h.optional ? 'Optional' : h.auto === 'protein' ? `${Math.round(eaten.protein)} of ${st.proteinMin} g` : h.auto === 'water' ? `${water} of ${st.waterTarget} glasses` : undefined} />
          ))}
        </div>
      </Card>

      <CheckReminders today={today} />

      {/* meals */}
      <SectionTitle right={<button className="text-deep font-medium text-[15px]" onClick={() => go('meals')}>Week →</button>}>Today’s meals</SectionTitle>
      {!day ? (
        <Card><p className="text-muted">No meals planned today yet.</p><button className="btn-primary mt-3" onClick={() => s.generateWeek(weekStart(today), 'rotation')}>Fill this week from my rotation</button></Card>
      ) : (
        <div className="space-y-3">
          <DessertBudget today={today} />
          {SLOTS.map((slot) => (day[slot] ?? []).map((it) => <MealCard key={it.id} date={today} slot={slot} item={it} />))}
          <LogDayButton today={today} />
          {!(day.dessert ?? []).length && (
            <Card><div className="font-medium">No dessert planned tonight</div><button className="btn-soft btn-sm mt-2" onClick={() => setSheet('add-dessert')}><Plus size={16} />Choose a dessert</button></Card>
          )}
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Extra foods</div>
          <button className="btn-soft btn-sm" onClick={() => setSheet('log')}><Plus size={16} />Log food</button>
        </div>
        {extras.length ? (
          <div className="divide-y divide-line mt-2">
            {extras.map((l) => (
              <div key={l.id} className="flex items-center gap-2 py-2.5">
                <div className="flex-1 min-w-0"><div className="text-[15px] truncate">{l.name}</div><div className="text-[13px] text-muted">{l.cal} cal · {l.protein} g protein</div></div>
                <button aria-label={`Delete ${l.name}`} className="w-10 h-10 grid place-items-center text-muted" onClick={() => s.set((x) => { x.logs = x.logs.filter((y) => y.id !== l.id); })}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
        ) : <p className="text-[14px] text-muted mt-1">Hungry? Add a snack anytime — fueling well helps you stick with it.</p>}
      </div>

      {sheet === 'weight' && <WeightSheet onClose={() => setSheet(null)} />}
      {sheet === 'log' && <LogFoodSheet date={today} onClose={() => setSheet(null)} />}
      {sheet === 'add-dessert' && <SwapSheet date={today} slot="dessert" onClose={() => setSheet(null)} />}
    </div>
  );
}
