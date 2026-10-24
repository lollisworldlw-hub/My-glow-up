import { useEffect, useState } from 'react';
import { ChevronRight, Droplet, Footprints, Plus, Scale, Sparkles, Trash2, Bike, Dumbbell, Moon } from 'lucide-react';
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
import { FoodPhotos } from '../components/ShareParts';
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
    if (habitAuto(s, h, today) && !s.habitChecks[today]?.[id]) { toast('This one checks itself from your logs'); return; }
    s.set((x) => { x.habitChecks[today] ??= {}; x.habitChecks[today][id] = !x.habitChecks[today][id]; });
  };

  return (
    <div className="space-y-2">
      <div className="pt-2 pb-1">
        <div className="text-[13px] text-muted">{fmtLong(today)}</div>
        <h1 className="h-serif text-[28px] leading-[1.1] mt-0.5">{greeting()}{st.name ? `, ${st.name}` : ''}</h1>
        <p className="text-[14px] text-muted mt-1.5">{msg}</p>
      </div>

      {/* today: the one big number */}
      <section className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] text-muted">Calories left today</div>
            <div className="num text-[64px] leading-[0.95] mt-1">{Math.max(0, Math.round(st.calTarget - eaten.cal)).toLocaleString()}</div>
            <div className="text-[13px] text-muted mt-2 tabular-nums">{Math.round(eaten.cal).toLocaleString()} eaten of {st.calTarget.toLocaleString()} · planned {Math.round(plan.cal).toLocaleString()}</div>
          </div>
          <Ring pct={calPct} ghostPct={(plan.cal / st.calTarget) * 100} size={76} stroke={4}>
            <span className="text-[12px] text-muted tabular-nums">{Math.round(Math.min(999, calPct))}%</span>
          </Ring>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-line">
          <div>
            <div className="flex justify-between text-[13px]"><span className="text-muted">Protein</span><span className="tabular-nums">{Math.round(eaten.protein)}<span className="text-muted"> / {st.proteinMin} g</span></span></div>
            <div className="mt-2"><Bar pct={(eaten.protein / st.proteinMin) * 100} color="var(--sage)" /></div>
          </div>
          <div>
            <div className="flex justify-between text-[13px]"><span className="text-muted">Water</span><span className="tabular-nums">{water}<span className="text-muted"> / {st.waterTarget} oz</span></span></div>
            <div className="mt-2"><Bar pct={(water / st.waterTarget) * 100} color="var(--rose)" /></div>
          </div>
        </div>
        <ProteinFixer today={today} />
      </section>

      <CheckinCard today={today} />
      <CycleChip today={today} />

      {/* weight */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[13px] text-muted">Weight</div>
            <div className="num text-[34px] leading-none mt-1">{showW(cur, st.weightUnit)}</div>
          </div>
          <button className="btn-ghost btn-sm" onClick={() => setSheet('weight')}><Scale size={15} strokeWidth={1.75} />Log weigh-in</button>
        </div>
        <div className="mt-3"><Bar pct={p.pct} color="var(--gold)" /></div>
        <div className="flex justify-between text-[12.5px] text-muted mt-2 tabular-nums">
          <span>{showW(Math.max(0, p.lost), st.weightUnit)} lost</span>
          <span>{showW(p.remaining, st.weightUnit)} to {showW(st.goalWeight, st.weightUnit)}</span>
        </div>
      </Card>

      {/* water */}
      <Card className="rise">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[14px] font-medium">Add water</div>
          <div className="text-[13px] text-muted tabular-nums">{water} / {st.waterTarget} oz</div>
        </div>
        <div className="grid grid-cols-5 gap-1.5 mt-2.5">
          {[8, 12, 16, 20].map((oz) => (
            <button key={oz} className="chip justify-center !py-2 tabular-nums" aria-label={`Add ${oz} ounces`} onClick={() => s.set((x) => { x.water[today] = (x.water[today] ?? 0) + oz; })}>+{oz}</button>
          ))}
           <button disabled={!water} className="chip justify-center !py-2 text-muted disabled:opacity-40" aria-label="Remove 8 ounces" onClick={() => s.set((x) => { x.water[today] = Math.max(0, (x.water[today] ?? 0) - 8); })}>−8</button>
        </div>
      </Card>

      {/* workout today */}
      <Card className="rise" onClick={() => go('workouts')}>
        <div className="eyebrow mb-3">Today’s movement</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-petal grid place-items-center text-deep"><Footprints size={20} /></div>
          <div><div className="font-medium">{sched?.walk === 'walk' ? `${st.walkMinutes}-minute brisk lunch walk` : sched?.walk === 'optional' ? 'Optional walk' : 'Recovery day'}</div>
            <div className="text-[13px] text-muted">{s.workouts.some((w) => w.date === today && w.type === 'walk' && w.completed) ? 'Done' : 'Lunch break'}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-petal grid place-items-center text-deep">{sched?.home === 'strength' ? <Dumbbell size={20} /> : sched?.home === 'rest' ? <Moon size={20} /> : <Bike size={20} />}</div>
          <div className="flex-1"><div className="font-medium">{HOME_LABEL[sched?.home ?? 'rest']}</div>
            <div className="text-[13px] text-muted">{s.workouts.some((w) => w.date === today && w.type !== 'walk' && w.completed) ? 'Done' : sched?.home === 'rest' ? 'Enjoy the rest' : `${st.workoutMinutes} minutes at home`}</div></div>
          <ChevronRight size={18} strokeWidth={1.5} className="text-muted" />
        </div>
        <div className="mt-3 text-[13px] text-muted">Steps today: <b className="text-ink">{(s.steps[today] ?? 0).toLocaleString()}</b> of {st.stepsGoal.toLocaleString()}</div>
      </Card>

      {/* checklist */}
      <Card className="rise">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Today’s checklist</div>
          <Sparkles size={18} className="text-rose" />
        </div>
        <div className="h-serif text-[16px] mt-1 mb-1">
          {habits.done === habits.total && habits.total > 0 ? 'Every habit done today.' : `${habits.done} of ${habits.total} habits done`}
        </div>
        <div className="divide-y divide-line">
          {habits.habits.map((h) => (
            <CheckRow key={h.id} on={habitDone(s, h, today)} onToggle={() => toggleHabit(h.id)}
              title={h.name} sub={h.optional ? 'Optional' : h.auto === 'protein' ? `${Math.round(eaten.protein)} of ${st.proteinMin} g` : h.auto === 'water' ? `${water} of ${st.waterTarget} oz` : undefined} />
          ))}
        </div>
      </Card>

      <CheckReminders today={today} />

      {/* meals */}
      <SectionTitle right={<button className="text-deep font-medium text-[14px]" onClick={() => go('meals')}>Week →</button>}>Today’s meals</SectionTitle>
      {!day ? (
        <Card><p className="text-muted">No meals planned today yet.</p><button className="btn-primary mt-3" onClick={() => s.generateWeek(weekStart(today), 'rotation')}>Fill this week from my rotation</button></Card>
      ) : (
        <div className="space-y-2">
          <DessertBudget today={today} />
          {SLOTS.map((slot) => (day[slot] ?? []).map((it) => <MealCard key={it.id} date={today} slot={slot} item={it} />))}
          <LogDayButton today={today} />
          {!(day.dessert ?? []).length && (
            <Card><div className="font-medium">No dessert planned tonight</div><button className="btn-soft btn-sm mt-2" onClick={() => setSheet('add-dessert')}><Plus size={16} />Choose a dessert</button></Card>
          )}
        </div>
      )}

      <div className="card p-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Extra foods</div>
          <button className="btn-soft btn-sm" onClick={() => setSheet('log')}><Plus size={16} />Log food</button>
        </div>
        {extras.length ? (
          <div className="divide-y divide-line mt-2">
            {extras.map((l) => (
              <div key={l.id} className="flex items-center gap-2 py-2">
                <div className="flex-1 min-w-0"><div className="text-[14px] truncate">{l.name}</div><div className="text-[13px] text-muted">{l.cal} cal · {l.protein} g protein</div></div>
                <button aria-label={`Delete ${l.name}`} className="w-10 h-10 grid place-items-center text-muted" onClick={() => s.set((x) => { x.logs = x.logs.filter((y) => y.id !== l.id); })}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
        ) : <p className="text-[13px] text-muted mt-1">Hungry? Add a snack anytime — fueling well helps you stick with it.</p>}
      </div>

      <FoodPhotos date={today} />

      {sheet === 'weight' && <WeightSheet onClose={() => setSheet(null)} />}
      {sheet === 'log' && <LogFoodSheet date={today} onClose={() => setSheet(null)} />}
      {sheet === 'add-dessert' && <SwapSheet date={today} slot="dessert" onClose={() => setSheet(null)} />}
    </div>
  );
}
