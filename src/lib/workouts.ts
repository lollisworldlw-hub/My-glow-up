import type { WorkoutLog } from './types';

export type Intensity = 'easy' | 'moderate' | 'hard' | 'rest' | 'work';
export interface Phase {
  label: string;
  cue: string;
  kind: 'timed' | 'reps';
  seconds: number; // for reps phases: rough expected time (for progress only)
  reps?: number;
  exercise?: string;
  round?: number;
  intensity: Intensity;
  fill?: boolean; // cooldown that fills the remaining planned time
}

export interface WorkoutDef {
  id: WorkoutLog['type'];
  name: string;
  subtitle: string;
  plannedMin: number;
  phases: Phase[];
}

export const EXERCISES: Record<string, { name: string; how: string }> = {
  squat: { name: 'Bodyweight squats or chair sit-to-stands', how: 'Feet hip-width, sit hips back like reaching for a chair, chest tall. Stand by pressing through your heels. Use a real chair to tap down if you like.' },
  pushup: { name: 'Wall push-ups', how: 'Hands on the wall at shoulder height, step back. Lower your chest toward the wall, elbows angled back, then press away. Step farther back to make it harder.' },
  hinge: { name: 'Standing hip hinges', how: 'Soft knees, hands on hips. Push your hips straight back while your back stays long, then squeeze your glutes to stand tall.' },
  knee: { name: 'Standing knee-to-elbow', how: 'Hands behind your head. Lift one knee and bring the opposite elbow down to meet it, tightening your core. Alternate sides.' },
  march: { name: 'Marching in place', how: 'Lift knees to a comfortable height and swing your arms. Pick up the pace if you feel good.' },
  warmup: { name: 'Warm-up', how: 'Easy marching, arm circles, gentle side reaches and hip circles.' },
  cooldown: { name: 'Cool-down stretch', how: 'Slow breathing. Stretch calves, hamstrings, hip flexors, chest, and shoulders — about 30 seconds each.' },
  rest: { name: 'Rest', how: 'Breathe. Sip water. Take longer if you need it — skip ahead when ready.' }
};

const REST = 30;

/** Progression ladders: start at level 0, move up when the current level feels easy. */
export const LEVELS: Record<string, { name: string; how: string }[]> = {
  squat: [
    { name: 'Chair sit-to-stands', how: 'Sit all the way down on a sturdy chair, then stand up without using your hands if you can. Chest tall.' },
    { name: 'Bodyweight squats', how: 'Feet hip-width, sit hips back and down like reaching for a chair, then stand by pressing through your heels.' },
    { name: 'Slow squats (3 seconds down)', how: 'Count 3 slow seconds on the way down, then stand up normally. Slower = harder, no equipment needed.' },
    { name: 'Pause squats', how: 'Lower slowly, hold 2 seconds at the bottom, then stand. Keep your knees tracking over your toes.' },
    { name: 'Split squats (each leg)', how: 'One foot forward, one back. Lower your back knee toward the floor, then rise. Hold a wall for balance.' }
  ],
  pushup: [
    { name: 'Wall push-ups', how: 'Hands on the wall at shoulder height, step back. Lower your chest toward the wall, then press away.' },
    { name: 'Counter push-ups', how: 'Hands on a kitchen counter, body in a straight line. Lower your chest to the edge, then press up.' },
    { name: 'Low-incline push-ups', how: 'Hands on a sturdy couch arm or low table. Keep your core tight and body straight.' },
    { name: 'Knee push-ups', how: 'Knees on the floor, hands under shoulders. Lower your chest toward the floor, then press up.' },
    { name: 'Full push-ups', how: 'Toes on the floor, body like a plank. Lower as far as you can with good form.' }
  ],
  hinge: [
    { name: 'Standing hip hinges', how: 'Soft knees, hands on hips. Push hips straight back with a long back, then squeeze your glutes to stand.' },
    { name: 'Slow hip hinges + squeeze', how: 'Hinge back for 3 seconds, then stand and squeeze your glutes hard for 2 seconds.' },
    { name: 'Glute bridges', how: 'Lie on your back, knees bent. Press through your heels to lift your hips, squeeze, and lower slowly.' },
    { name: 'Supported single-leg hinges', how: 'Hold a chair. Hinge forward on one leg as the other lifts behind you. Switch legs halfway.' },
    { name: 'Single-leg glute bridges', how: 'Bridge with one foot on the floor and the other leg extended. Switch legs halfway.' }
  ],
  knee: [
    { name: 'Standing knee-to-elbow', how: 'Hands behind your head. Bring one knee up to meet the opposite elbow, tightening your core. Alternate.' },
    { name: 'Slow knee-to-elbow with hold', how: 'Same move, but hold the crunch for 2 seconds each rep.' },
    { name: 'Standing knee drives', how: 'Arms overhead, pull them down as you drive one knee up quickly. Alternate sides with control.' },
    { name: 'Dead bugs', how: 'On your back, arms up, knees bent over hips. Lower opposite arm and leg slowly, keeping your low back down.' },
    { name: 'Mountain climbers (slow)', how: 'Hands on a couch or floor, body straight. Bring one knee toward your chest at a time.' }
  ]
};
export const levelOf = (levels: Record<string, number> | undefined, id: string) => Math.min(LEVELS[id]?.length - 1 || 0, Math.max(0, levels?.[id] ?? 0));


export function strengthWorkout(minutes = 20, levels?: Record<string, number>): WorkoutDef {
  const phases: Phase[] = [
    { label: 'Warm-up', cue: EXERCISES.warmup.how, kind: 'timed', seconds: 180, exercise: 'warmup', intensity: 'easy' }
  ];
  for (const round of [1, 2]) {
    const ex = (id: string, reps: number, suffix = ''): Phase => {
      const lv = LEVELS[id]?.[levelOf(levels, id)];
      return { label: (lv?.name ?? EXERCISES[id].name) + suffix, cue: lv?.how ?? EXERCISES[id].how, kind: 'reps', reps, seconds: 45, exercise: id, round, intensity: 'work' };
    };
    const rest = (s = REST): Phase => ({ label: 'Rest', cue: EXERCISES.rest.how, kind: 'timed', seconds: s, exercise: 'rest', round, intensity: 'rest' });
    phases.push(
      ex('squat', 12), rest(),
      ex('pushup', 12), rest(),
      ex('hinge', 12), rest(),
      ex('knee', 24, ' (12 each side)'), rest(),
      { label: 'Marching in place', cue: EXERCISES.march.how, kind: 'timed', seconds: 60, exercise: 'march', round, intensity: 'moderate' }
    );
    if (round === 1) phases.push(rest(60));
  }
  phases.push({ label: 'Cool-down', cue: EXERCISES.cooldown.how, kind: 'timed', seconds: 240, exercise: 'cooldown', intensity: 'easy', fill: true });
  return { id: 'strength', name: 'Full-body strength', subtitle: 'Warm-up · 2 rounds · cool-down', plannedMin: minutes, phases };
}

export function bikeModerate(minutes = 20): WorkoutDef {
  const mid = Math.max(4, minutes - 6) * 60;
  return {
    id: 'bike-moderate', name: 'Moderate bike ride', subtitle: 'Steady and comfortable', plannedMin: minutes,
    phases: [
      { label: 'Easy warm-up', cue: 'Light resistance, relaxed pace.', kind: 'timed', seconds: 180, intensity: 'easy' },
      { label: 'Moderate ride', cue: 'A pace where you can talk in short sentences.', kind: 'timed', seconds: mid, intensity: 'moderate' },
      { label: 'Easy cool-down', cue: 'Ease off and let your breathing settle.', kind: 'timed', seconds: 180, intensity: 'easy' }
    ]
  };
}

export function bikeIntervals(): WorkoutDef {
  const phases: Phase[] = [{ label: 'Easy warm-up', cue: 'Light resistance, relaxed pace.', kind: 'timed', seconds: 240, intensity: 'easy' }];
  for (let i = 1; i <= 4; i++) {
    phases.push(
      { label: `Push ${i} of 4`, cue: 'Moderately hard — breathing deeper, talking is tough.', kind: 'timed', seconds: 60, intensity: 'hard', round: i },
      { label: `Recover ${i} of 4`, cue: 'Easy spin. Let your heart rate come down.', kind: 'timed', seconds: 120, intensity: 'easy', round: i }
    );
  }
  phases.push({ label: 'Easy cool-down', cue: 'Ease off and let your breathing settle.', kind: 'timed', seconds: 240, intensity: 'easy' });
  return { id: 'bike-intervals', name: 'Interval bike ride', subtitle: '4 short pushes with easy recovery', plannedMin: 20, phases };
}

export function bikeEasy(minutes = 20): WorkoutDef {
  return {
    id: 'bike-easy', name: 'Easy bike ride', subtitle: 'Optional, gentle movement', plannedMin: minutes,
    phases: [{ label: 'Easy ride', cue: 'Comfortable pace. Music or a show helps.', kind: 'timed', seconds: minutes * 60, intensity: 'easy' }]
  };
}

export function walk(minutes = 20): WorkoutDef {
  return {
    id: 'walk', name: 'Lunch walk', subtitle: 'Brisk, fresh-air walk', plannedMin: minutes,
    phases: [{ label: 'Brisk walk', cue: 'Brisk but conversational. Turn around at the halfway chime.', kind: 'timed', seconds: minutes * 60, intensity: 'moderate' }]
  };
}

export function workoutById(id: WorkoutLog['type'], s: { workoutMinutes: number; walkMinutes: number }, levels?: Record<string, number>): WorkoutDef {
  switch (id) {
    case 'strength': return strengthWorkout(s.workoutMinutes, levels);
    case 'bike-moderate': return bikeModerate(s.workoutMinutes);
    case 'bike-intervals': return bikeIntervals();
    case 'bike-easy': return bikeEasy(s.workoutMinutes);
    case 'walk': return walk(s.walkMinutes);
    default: return walk(s.walkMinutes);
  }
}

// ---------- timestamp-based timer engine ----------
export interface Session {
  workoutId: WorkoutLog['type'];
  date: string;
  phases: Phase[];
  index: number;
  phaseStart: number;
  pausedAt: number | null;
  phasePaused: number; // ms paused in current phase
  startedAt: number;
  totalPaused: number;
  plannedSec: number;
  reps: number;
  repLog?: Record<string, number[]>;
}

export function startSession(def: WorkoutDef, date: string, now: number): Session {
  return {
    workoutId: def.id, date, phases: def.phases.map((p) => ({ ...p })), index: 0, phaseStart: now,
    pausedAt: null, phasePaused: 0, startedAt: now, totalPaused: 0, plannedSec: def.plannedMin * 60, reps: 0
  };
}

export const phaseElapsed = (s: Session, now: number) =>
  Math.max(0, ((s.pausedAt ?? now) - s.phaseStart - s.phasePaused) / 1000);

export const activeElapsed = (s: Session, now: number) =>
  Math.max(0, ((s.pausedAt ?? now) - s.startedAt - s.totalPaused) / 1000);

function enterPhase(s: Session, index: number, start: number, now: number): Session {
  const phases = s.phases.slice();
  const p = phases[index];
  if (p?.fill) {
    const elapsed = (start - s.startedAt - s.totalPaused) / 1000;
    phases[index] = { ...p, seconds: Math.max(120, Math.round(s.plannedSec - elapsed)) };
  }
  const totalPaused = s.pausedAt ? s.totalPaused + (now - s.pausedAt) : s.totalPaused;
  return { ...s, phases, index, phaseStart: start, phasePaused: 0, reps: 0, totalPaused, pausedAt: s.pausedAt ? now : null };
}

/** Advances through any timed phases that finished (also while the app was in the background). */
export function tick(s: Session, now: number): { s: Session; changed: number } {
  let changed = 0;
  let cur = s;
  while (!cur.pausedAt && cur.index < cur.phases.length) {
    const p = cur.phases[cur.index];
    if (p.kind !== 'timed') break;
    const el = phaseElapsed(cur, now);
    if (el < p.seconds) break;
    const end = cur.phaseStart + cur.phasePaused + p.seconds * 1000;
    cur = enterPhase(cur, cur.index + 1, end, now);
    changed++;
  }
  return { s: cur, changed };
}

export const isDone = (s: Session) => s.index >= s.phases.length;

export function skip(s: Session, now: number): Session {
  const p = s.phases[s.index];
  let repLog = s.repLog;
  if (p?.kind === 'reps' && p.exercise) repLog = { ...(repLog ?? {}), [p.exercise]: [...(repLog?.[p.exercise] ?? []), s.reps] };
  return { ...enterPhase(s, s.index + 1, now, now), repLog };
}

/** Suggest moving up a level when the last two strength sessions hit every rep target and didn't feel hard. */
export function readyToLevelUp(history: WorkoutLog[], id: string, level: number, target: number): boolean {
  const recent = history.filter((w) => w.type === 'strength' && w.completed && w.reps?.[id]?.length && (w.levels?.[id] ?? 0) === level)
    .sort((a, b) => b.at - a.at).slice(0, 2);
  if (recent.length < 2) return false;
  return recent.every((w) => w.reps![id].every((r) => r >= target) && (w.difficulty == null || w.difficulty <= 3));
}
export function pause(s: Session, now: number): Session {
  return s.pausedAt ? s : { ...s, pausedAt: now };
}
export function resume(s: Session, now: number): Session {
  if (!s.pausedAt) return s;
  const d = now - s.pausedAt;
  return { ...s, pausedAt: null, phasePaused: s.phasePaused + d, totalPaused: s.totalPaused + d };
}
