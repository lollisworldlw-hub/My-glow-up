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

export function strengthWorkout(minutes = 20): WorkoutDef {
  const phases: Phase[] = [
    { label: 'Warm-up', cue: EXERCISES.warmup.how, kind: 'timed', seconds: 180, exercise: 'warmup', intensity: 'easy' }
  ];
  for (const round of [1, 2]) {
    const ex = (id: string, reps: number, label?: string): Phase => ({
      label: label ?? EXERCISES[id].name, cue: EXERCISES[id].how, kind: 'reps', reps, seconds: 45, exercise: id, round, intensity: 'work'
    });
    const rest = (s = REST): Phase => ({ label: 'Rest', cue: EXERCISES.rest.how, kind: 'timed', seconds: s, exercise: 'rest', round, intensity: 'rest' });
    phases.push(
      ex('squat', 12), rest(),
      ex('pushup', 12), rest(),
      ex('hinge', 12), rest(),
      ex('knee', 24, 'Standing knee-to-elbow (12 each side)'), rest(),
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

export function workoutById(id: WorkoutLog['type'], s: { workoutMinutes: number; walkMinutes: number }): WorkoutDef {
  switch (id) {
    case 'strength': return strengthWorkout(s.workoutMinutes);
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
  return enterPhase(s, s.index + 1, now, now);
}
export function pause(s: Session, now: number): Session {
  return s.pausedAt ? s : { ...s, pausedAt: now };
}
export function resume(s: Session, now: number): Session {
  if (!s.pausedAt) return s;
  const d = now - s.pausedAt;
  return { ...s, pausedAt: null, phasePaused: s.phasePaused + d, totalPaused: s.totalPaused + d };
}
