import type { State } from './store';
import { addDays, daysBetween, weekDays, weekStart } from './date';
import { sortWeights } from './weight';
import { dayHabitStats } from './derived';
import { LEVELS } from './workouts';

export interface Achievement {
  key: string;
  icon: string;
  title: string; // no numbers about the body
  withNumbers?: string; // optional version with details (opt-in)
  date: string;
}

/** Things worth celebrating, computed from the person's own (private) data. */
export function computeAchievements(s: State, today: string): Achievement[] {
  const out: Achievement[] = [];
  const st = s.settings;

  // weight milestones: every 5 lbs below start
  const sorted = sortWeights(s.weights);
  if (st.startWeight > 0) {
    for (let k = 1; k <= 40; k++) {
      const mark = st.startWeight - 5 * k;
      if (mark < st.goalWeight - 0.01) break;
      const hit = sorted.find((w) => w.lbs <= mark);
      if (hit) out.push({ key: `lost-${5 * k}`, icon: '🏆', title: 'Reached a new weight milestone!', withNumbers: `Down ${5 * k} lbs since I started!`, date: hit.date });
    }
    const goal = sorted.find((w) => w.lbs <= st.goalWeight);
    if (goal && st.goalWeight > 0) out.push({ key: 'goal', icon: '👑', title: 'I reached my goal weight!', withNumbers: `I reached my goal of ${st.goalWeight} lbs!`, date: goal.date });
  }

  // workouts
  const done = s.workouts.filter((w) => w.completed).sort((a, b) => a.at - b.at);
  for (const n of [1, 10, 25, 50, 100, 200]) {
    if (done.length >= n) out.push({ key: `workouts-${n}`, icon: n === 1 ? '🌱' : '💪', title: n === 1 ? 'Finished my first workout!' : `Completed ${n} workouts!`, date: done[n - 1].date });
  }
  const ws = weekStart(today);
  const thisWeek = done.filter((w) => w.date >= ws).length;
  if (thisWeek >= 5) out.push({ key: `week-workouts-${ws}`, icon: '🔥', title: `${thisWeek} workouts this week!`, date: today });

  // strength levels
  for (const [id, lv] of Object.entries(s.exerciseLevels)) {
    if (lv > 0 && LEVELS[id]) out.push({ key: `level-${id}-${lv}`, icon: '⭐', title: `Leveled up to ${LEVELS[id][lv].name}!`, date: today });
  }

  // habit streak (days in a row with all required habits)
  let streak = 0;
  for (let d = today; d >= st.startDate; d = addDays(d, -1)) {
    const h = dayHabitStats(s, d);
    if (h.total && h.done === h.total) streak++;
    else if (d !== today) break;
  }
  for (const n of [3, 7, 14, 30, 60, 100]) if (streak >= n) out.push({ key: `streak-${n}-${addDays(today, -streak + 1)}`, icon: '✨', title: `${n}-day habit streak!`, date: today });

  // weekly check-ins
  if (s.checkins.length >= 1) out.push({ key: 'checkin-1', icon: '📋', title: 'Did my first weekly check-in!', date: new Date(s.checkins[0].at).toISOString().slice(0, 10) });
  if (s.checkins.length >= 4) out.push({ key: 'checkin-4', icon: '📅', title: 'A whole month of weekly check-ins!', date: today });

  // steps
  const stepDays = weekDays(ws).filter((d) => (s.steps[d] ?? 0) >= st.stepsGoal).length;
  if (stepDays >= 5) out.push({ key: `steps-${ws}`, icon: '👟', title: `Hit my step goal ${stepDays} days this week!`, date: today });

  // mind & cleaning
  const mindWeek = weekDays(ws).reduce((a, d) => a + (s.mindChecks[d]?.length ?? 0), 0);
  if (mindWeek >= 10) out.push({ key: `mind-${ws}`, icon: '🫶', title: 'Took extra good care of my mind this week', date: today });
  const cleanWeek = weekDays(ws).reduce((a, d) => a + (s.cleanDone[d]?.length ?? 0), 0);
  if (cleanWeek >= 15) out.push({ key: `clean-${ws}`, icon: '🧼', title: 'Kept my home sparkling this week!', date: today });

  // waist
  const waist = s.measures.filter((m) => m.values.waistNavel != null).sort((a, b) => a.date.localeCompare(b.date));
  if (waist.length > 1) {
    const diff = waist[0].values.waistNavel! - waist[waist.length - 1].values.waistNavel!;
    if (diff >= 1) out.push({ key: `waist-${Math.floor(diff)}`, icon: '📏', title: 'My waistline is shrinking!', withNumbers: `${Math.floor(diff)} inch${Math.floor(diff) > 1 ? 'es' : ''} off my waist!`, date: waist[waist.length - 1].date });
  }

  // consistency since start
  const days = daysBetween(st.startDate, today);
  for (const n of [7, 30, 90, 180, 365]) if (days >= n) out.push({ key: `days-${n}`, icon: '🌸', title: n === 7 ? 'One week into my journey!' : n === 365 ? 'One whole year on my journey!' : `${n} days into my journey!`, date: addDays(st.startDate, n) });

  return out.sort((a, b) => b.date.localeCompare(a.date));
}
