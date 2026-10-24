// The weekly "coach": looks at the last few weeks and suggests small, explained changes to the plan.
import type { State } from './store';
import { addDays, weekDays } from './date';
import { weekSummary } from '../components/Checkin';
import { suggestTargets } from './targets';

export interface Suggestion { id: string; title: string; why: string; apply: (x: State) => void }

const calFloor = (sex: string) => (sex === 'male' ? 1500 : sex === 'female' ? 1300 : 1400);

export function planSuggestions(s: State, monday: string, today: string): Suggestion[] {
  const st = s.settings;
  const w = weekSummary(s, monday, today);
  const out: Suggestion[] = [];
  const floor = calFloor(st.sex);

  // Calories: only when there's enough logging to trust the numbers
  if (w.avg != null && w.change != null && w.loggedDays >= 4) {
    if (w.change <= -(w.avg * 0.01)) {
      const to = st.calTarget + 100;
      out.push({ id: 'cal-up', title: `Raise calories to ${to.toLocaleString()}`, why: `You lost ${Math.abs(w.change)} lb this week, faster than about 1% of your weight. A little more food protects your energy and muscle.`,
        apply: (x) => { x.settings.calTarget = to; x.settings.calMin = to - 50; x.settings.calMax = to + 100; } });
    } else if (w.plateau && w.loggedDays >= 5 && w.avgCal != null && w.avgCal <= st.calMax) {
      const to = Math.max(floor, st.calTarget - 100);
      if (to < st.calTarget) out.push({ id: 'cal-down', title: `Lower calories to ${to.toLocaleString()}`, why: `Your 3-week trend is flat even though you logged ${w.loggedDays} days and stayed on target. A small 100-calorie trim usually gets things moving again.`,
        apply: (x) => { x.settings.calTarget = to; x.settings.calMin = to - 50; x.settings.calMax = to + 100; } });
    }
  }
  // Targets drift as weight comes off: recalculate from the current average
  if (!out.length && w.avg != null && st.age && st.heightIn) {
    const t = suggestTargets({ sex: st.sex, age: st.age, heightIn: st.heightIn, weightLb: w.avg, goalLb: st.goalWeight, activity: st.activity });
    if (t.cal <= st.calTarget - 100 && w.avg < st.startWeight - 4) {
      const to = Math.max(floor, t.cal);
      out.push({ id: 'cal-recalc', title: `Update calories to ${to.toLocaleString()}`, why: `You’re down ${Math.round(st.startWeight - w.avg)} lb since you started, so your body needs a bit less now. This keeps your progress steady.`,
        apply: (x) => { x.settings.calTarget = to; x.settings.calMin = to - 50; x.settings.calMax = to + 100; } });
    }
  }

  // Steps: nudge the goal toward what you actually do
  const last7 = weekDays(addDays(monday, -7)).map((d) => s.steps[d]).filter((n): n is number => typeof n === 'number' && n > 0);
  if (last7.length >= 4) {
    const avg = Math.round(last7.reduce((a, b) => a + b, 0) / last7.length);
    if (avg >= st.stepsGoal && st.stepsGoal < 12000) {
      const to = Math.min(12000, st.stepsGoal + 1000);
      out.push({ id: 'steps-up', title: `Raise your step goal to ${to.toLocaleString()}`, why: `You averaged ${avg.toLocaleString()} steps a day, above your goal. Ready for a little more.`, apply: (x) => { x.settings.stepsGoal = to; } });
    } else if (avg < st.stepsGoal * 0.5 && st.stepsGoal > 3000) {
      const to = Math.max(3000, st.stepsGoal - 1000);
      out.push({ id: 'steps-down', title: `Set your step goal to ${to.toLocaleString()} for now`, why: `You averaged ${avg.toLocaleString()} steps. A goal you can hit builds the habit faster.`, apply: (x) => { x.settings.stepsGoal = to; } });
    }
  }

  // Workouts: every planned home workout done → a little longer
  const prevWeek = weekDays(addDays(monday, -7));
  const planned = prevWeek.filter((d) => { const day = s.schedule[new Date(d + 'T12:00').getDay()]; return day && day.home !== 'rest' && !day.homeOptional; }).length;
  const done = s.workouts.filter((x) => x.completed && x.type !== 'walk' && prevWeek.includes(x.date)).length;
  if (planned > 0 && done >= planned && st.workoutMinutes < 40) {
    const to = st.workoutMinutes + 5;
    out.push({ id: 'workout-up', title: `Make home workouts ${to} minutes`, why: `You finished all ${planned} planned workouts last week. Five more minutes keeps you progressing.`, apply: (x) => { x.settings.workoutMinutes = to; } });
  }
  return out.slice(0, 3);
}
