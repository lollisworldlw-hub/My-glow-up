import { useState } from 'react';
import { useStore, type State } from '../lib/store';
import { addDays, fmtShort, weekDays } from '../lib/date';
import { weekAverage } from '../lib/weight';
import { consumed, dayHabitStats } from '../lib/derived';
import { nearPeriod } from '../lib/cycle';
import { Field, Sheet, toast, celebrate } from './ui';
import { showW } from './WeightSheet';

export function weekSummary(s: State, monday: string, today: string) {
  const days = weekDays(monday).filter((d) => d <= today);
  const avg = weekAverage(s.weights, monday);
  const prev = weekAverage(s.weights, addDays(monday, -7));
  const change = avg != null && prev != null ? +(avg - prev).toFixed(1) : null;
  // 3-week trend for plateau detection
  const w3 = weekAverage(s.weights, addDays(monday, -21));
  const threeWeek = avg != null && w3 != null ? +(avg - w3).toFixed(1) : null;
  const waist = [...s.measures].filter((m) => m.values.waistNavel != null).sort((a, b) => a.date.localeCompare(b.date));
  const waistChange = waist.length > 1 ? +(waist[waist.length - 1].values.waistNavel! - waist[0].values.waistNavel!).toFixed(1) : null;
  const habitPct = days.length ? Math.round(days.reduce((a, d) => { const h = dayHabitStats(s, d); return a + (h.total ? h.done / h.total : 0); }, 0) / days.length * 100) : 0;
  const workouts = s.workouts.filter((w) => w.completed && w.date >= monday && w.date <= addDays(monday, 6)).length;
  const loggedDays = days.filter((d) => s.logs.some((l) => l.date === d));
  const avgCal = loggedDays.length ? Math.round(loggedDays.reduce((a, d) => a + consumed(s, d).cal, 0) / loggedDays.length) : null;
  const avgPro = loggedDays.length ? Math.round(loggedDays.reduce((a, d) => a + consumed(s, d).protein, 0) / loggedDays.length) : null;
  const period = days.some((d) => nearPeriod(s.periods, d, today));
  let pace: { label: string; tone: 'good' | 'gentle' | 'info' } | null = null;
  if (change != null) {
    if (change <= -1.6) pace = { label: 'Faster than planned — make sure you’re eating enough to keep your energy and muscle.', tone: 'info' };
    else if (change <= -0.5) pace = { label: 'Right on your 0.5–1 lb/week pace ♡', tone: 'good' };
    else if (change < 0) pace = { label: 'Slow and steady — still moving the right way.', tone: 'good' };
    else pace = { label: period ? 'Up a little — very likely water around your period. The trend will settle.' : 'Up or flat this week. One week is noise; the trend over several weeks is what counts.', tone: 'gentle' };
  }
  const plateau = threeWeek != null && threeWeek > -0.5 && !period;
  return { avg, prev, change, threeWeek, waistChange, habitPct, workouts, avgCal, avgPro, loggedDays: loggedDays.length, period, pace, plateau };
}

export function CheckinSheet({ monday, today, onClose }: { monday: string; today: string; onClose: () => void }) {
  const s = useStore();
  const ex = s.checkins.find((c) => c.weekStart === monday);
  const [wins, setWins] = useState(ex?.wins ?? '');
  const [challenge, setChallenge] = useState(ex?.challenge ?? '');
  const [focus, setFocus] = useState(ex?.focus ?? '');
  const w = weekSummary(s, monday, today);
  const u = s.settings.weightUnit;
  const st = s.settings;

  const save = () => {
    s.set((x) => {
      x.checkins = x.checkins.filter((c) => c.weekStart !== monday);
      x.checkins.push({ weekStart: monday, wins, challenge, focus, at: Date.now() });
    });
    if (!ex) celebrate();
    toast('Check-in saved — see you next week ♡');
    onClose();
  };

  const Stat = ({ l, v }: { l: string; v: string }) => <div className="rounded-2xl bg-petal px-3 py-2.5"><div className="text-[12px] text-muted">{l}</div><div className="font-semibold tabular-nums">{v}</div></div>;
  return (
    <Sheet open onClose={onClose} title={`Week of ${fmtShort(monday)}`} footer={<button className="btn-primary w-full" onClick={save}>Save check-in</button>}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Stat l="Average weight" v={w.avg != null ? showW(w.avg, u) : 'No weigh-ins'} />
        <Stat l="vs last week" v={w.change != null ? `${w.change > 0 ? '+' : ''}${w.change} lb` : '—'} />
        <Stat l="Habits done" v={`${w.habitPct}%`} />
        <Stat l="Workouts & walks" v={String(w.workouts)} />
        <Stat l="Avg logged calories" v={w.avgCal != null ? `${w.avgCal}` : '—'} />
        <Stat l="Avg protein" v={w.avgPro != null ? `${w.avgPro} g` : '—'} />
        {w.waistChange != null && <Stat l="Waist since start" v={`${w.waistChange > 0 ? '+' : ''}${w.waistChange} in`} />}
        <Stat l="Days logged" v={`${w.loggedDays}`} />
      </div>
      {w.pace && <div className={`rounded-2xl px-4 py-3 mb-3 text-[15px] ${w.pace.tone === 'good' ? 'bg-sage/20' : 'bg-petal'}`}>{w.pace.label}</div>}
      {w.avgPro != null && w.avgPro < st.proteinMin && <div className="rounded-2xl bg-petal px-4 py-3 mb-3 text-[15px]">Protein averaged {w.avgPro} g. Getting closer to {st.proteinMin} g helps you keep muscle and stay full — a yogurt cup or 2 eggs closes most of the gap.</div>}
      {w.plateau && (
        <div className="rounded-2xl border border-blush px-4 py-3 mb-3 text-[15px]">
          <div className="font-semibold mb-1">Your 3-week trend is flat</div>
          <p className="mb-1.5">That’s normal at times. A few things worth looking at, in order:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Log every bite for a week, including oils, sauces, and tastes.</li>
            <li>Weigh portions instead of eyeballing them for a few days.</li>
            <li>Add 1,000–2,000 daily steps.</li>
            <li>Check sleep — short sleep raises hunger.</li>
            <li>If all of that is solid for 2 more weeks, you could lower your target by about 100 calories in Settings. That’s your call — the app never changes it for you.</li>
          </ol>
        </div>
      )}
      <Field label="Wins this week"><textarea className="field py-3 min-h-[70px]" value={wins} onChange={(e) => setWins(e.target.value)} placeholder="Walked every workday, tried a new dessert…" /></Field>
      <Field label="What felt hard?"><textarea className="field py-3 min-h-[70px]" value={challenge} onChange={(e) => setChallenge(e.target.value)} /></Field>
      <Field label="One focus for next week"><input className="field" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Hit protein 5 of 7 days" /></Field>
    </Sheet>
  );
}
