import { useEffect, useState } from 'react';
import { Plus, Play, Scale, Sparkles, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { SLOTS, SLOT_LABEL } from '../lib/types';
import { itemMacros } from '../lib/nutrition';
import { consumed, dayHabitStats, habitAuto, habitDone, planned, useToday } from '../lib/derived';
import { fmtLong, greeting, weekStart, daysBetween, weekday } from '../lib/date';
import { momentQuote } from '../lib/quotes';
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
  const [, tick] = useState(0);
  useEffect(() => {
    const t = () => tick((n) => n + 1);
    const iv = setInterval(t, 5 * 60000);
    document.addEventListener('visibilitychange', t);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', t); };
  }, []);
  const now = new Date();
  const hourSeed = daysBetween('2026-01-01', today) * 24 + now.getHours();
  const msg = momentQuote(st.quoteStyle, {
    hour: now.getHours(), waterPct: water / Math.max(1, st.waterTarget), ate: s.logs.some((l) => l.date === today),
    breakfast: s.logs.some((l) => l.date === today && l.slot === 'breakfast'), proteinPct: eaten.protein / Math.max(1, st.proteinMin),
    workoutDue: (sched?.home ?? 'rest') !== 'rest' && !sched?.homeOptional && !s.workouts.some((w) => w.date === today && w.type !== 'walk' && w.completed)
  }, hourSeed);
  const loggedIds = new Set(s.logs.filter((l) => l.date === today && l.planItemId).map((l) => l.planItemId));
  const next = (() => {
    for (const slot of SLOTS) for (const item of (day?.[slot] ?? [])) {
      if (loggedIds.has(item.id)) continue;
      const r = item.recipeId ? s.recipes[item.recipeId] : undefined;
      return { slot, item, name: r?.name ?? item.quick?.name ?? 'Meal', cal: itemMacros(item, s.recipes, s.foods).cal };
    }
    return null;
  })();
  const moveDone = s.workouts.some((w) => w.date === today && w.type !== 'walk' && w.completed);

  const toggleHabit = (id: string) => {
    const h = s.habits.find((x) => x.id === id)!;
    if (habitAuto(s, h, today) && !s.habitChecks[today]?.[id]) { toast('This one checks itself from your logs'); return; }
    s.set((x) => { x.habitChecks[today] ??= {}; x.habitChecks[today][id] = !x.habitChecks[today][id]; });
  };

  return (
    <div className="space-y-2">
      <div className="band on-dark -mx-3 px-3 pb-5 pt-[calc(78px+env(safe-area-inset-top))] space-y-0">
      <div className="pt-2 pb-5 px-2">
        <div className="text-[13px] text-muted">{fmtLong(today)}</div>
        <h1 className="h-serif text-[34px] leading-[1.08] mt-1">{greeting()}{st.name ? `, ${st.name}` : ''}.</h1>
        <p className="text-[14px] text-muted mt-2 leading-snug">
          Day {Math.max(1, daysBetween(st.startDate ?? today, today) + 1)}.{p.lost > 0 ? ` Down ${showW(p.lost, st.weightUnit)}.` : ''} {msg}
        </p>
      </div>

      {/* hero: gold ring + the three daily numbers */}
      <section className="card p-5">
        <div className="flex items-center gap-5">
          <Ring pct={calPct} ghostPct={(plan.cal / st.calTarget) * 100} size={118} stroke={4} color="url(#goldRing)">
            <div className="flex flex-col items-center">
              <span className="num text-[38px] leading-none">{Math.max(0, Math.round(st.calTarget - eaten.cal)).toLocaleString()}</span>
              <span className="text-[11px] text-muted mt-1">cal left</span>
            </div>
          </Ring>
          <div className="flex-1 min-w-0 space-y-3.5">
            {[
              ['Protein', `${Math.round(eaten.protein)} / ${st.proteinMin} g`, (eaten.protein / st.proteinMin) * 100, 'var(--gold)'],
              ['Water', `${water} / ${st.waterTarget} oz`, (water / st.waterTarget) * 100, 'var(--sage)'],
              ['Steps', (s.steps[today] ?? 0).toLocaleString(), ((s.steps[today] ?? 0) / st.stepsGoal) * 100, 'var(--ink)']
            ].map(([l, v, pc, c]) => (
              <div key={l as string}>
                <div className="flex justify-between text-[13px]"><span className="text-muted">{l}</span><span className="tabular-nums">{v}</span></div>
                <div className="mt-1.5"><Bar pct={pc as number} color={c as string} h={3} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[12px] text-muted mt-4 tabular-nums">{Math.round(eaten.cal).toLocaleString()} eaten of {st.calTarget.toLocaleString()}, {Math.round(plan.cal).toLocaleString()} planned</div>
        <ProteinFixer today={today} />
      </section>
      </div>
      <div className="pt-1" />

      {/* today's plan */}
      <div className="text-[13px] text-muted px-1 pt-1">Today’s plan</div>
      <div className="card p-3.5 flex items-center gap-3.5">
        <div className="w-[50px] h-[50px] rounded-[14px] shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-2))' }} />
        <div className="flex-1 min-w-0">
          <div className="h-serif text-[18px] leading-tight truncate">{next ? next.name : 'All meals logged'}</div>
          <div className="text-[12px] text-muted mt-0.5">{next ? `${SLOT_LABEL[next.slot]}, ${Math.round(next.cal)} cal` : 'Add a snack anytime'}</div>
        </div>
        {next
          ? <button className="btn-primary btn-sm !px-4" onClick={() => s.logItem(today, next.slot, next.item.id)}>Log</button>
          : <button className="btn-primary btn-sm !px-4" onClick={() => setSheet('log')}>Add</button>}
      </div>
      <button className="card p-3.5 flex items-center gap-3.5 w-full text-left" onClick={() => go('workouts')}>
        <div className="w-[50px] h-[50px] rounded-[14px] shrink-0" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--sage) 45%, white), var(--sage))' }} />
        <div className="flex-1 min-w-0">
          <div className="h-serif text-[18px] leading-tight truncate">{HOME_LABEL[sched?.home ?? 'rest']}</div>
          <div className="text-[12px] text-muted mt-0.5">{moveDone ? 'Done today' : sched?.home === 'rest' ? 'Enjoy the rest' : `${st.workoutMinutes} min at home`}</div>
        </div>
        <span className="w-9 h-9 rounded-full border border-ink grid place-items-center shrink-0"><Play size={12} fill="currentColor" /></span>
      </button>

      <button className="card p-3.5 flex items-center gap-3.5 w-full text-left" onClick={() => setSheet('log')}>
        <div className="w-[50px] h-[50px] rounded-[14px] shrink-0 grid place-items-center" style={{ background: 'var(--petal)' }}><Plus size={20} strokeWidth={1.6} /></div>
        <div className="flex-1 min-w-0">
          <div className="h-serif text-[18px] leading-tight">Log food</div>
          <div className="text-[12px] text-muted mt-0.5">Search, scan a barcode or quick add</div>
        </div>
        <Plus size={18} className="text-muted" />
      </button>

      {/* water */}
      <div className="card px-4 py-3 flex items-center justify-between gap-2">
        <span className="text-[14px]">Add water</span>
        <div className="flex gap-1.5">
          {[8, 16, 24].map((oz) => (
            <button key={oz} className="chip !py-1.5 tabular-nums" aria-label={`Add ${oz} ounces`} onClick={() => s.set((x) => { x.water[today] = (x.water[today] ?? 0) + oz; })}>+{oz}</button>
          ))}
          <button disabled={!water} className="chip !py-1.5 text-muted disabled:opacity-40" aria-label="Remove 8 ounces" onClick={() => s.set((x) => { x.water[today] = Math.max(0, (x.water[today] ?? 0) - 8); })}>−8</button>
        </div>
      </div>

      <CheckinCard today={today} />
      <CycleChip today={today} />

      {/* weight */}
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[13px] text-muted">Weight</div>
            <div className="num text-[34px] leading-none mt-1">{showW(cur, st.weightUnit)}</div>
          </div>
          <button className="btn-ghost btn-sm" onClick={() => setSheet('weight')}><Scale size={15} strokeWidth={1.75} />Log</button>
        </div>
        <div className="mt-3"><Bar pct={p.pct} color="var(--gold)" h={3} /></div>
        <div className="flex justify-between text-[12.5px] text-muted mt-2 tabular-nums">
          <span>{showW(Math.max(0, p.lost), st.weightUnit)} lost</span>
          <span>{showW(p.remaining, st.weightUnit)} to {showW(st.goalWeight, st.weightUnit)}</span>
        </div>
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
