import { useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipForward, Square, Plus, Minus } from 'lucide-react';
import { useStore } from '../lib/store';
import { activeElapsed, isDone, pause, phaseElapsed, resume, skip, tick } from '../lib/workouts';
import type { Session } from '../lib/workouts';
import { uid } from '../lib/date';
import { ExerciseArt } from './Art';
import { Bar, Ring, Sheet, celebrate, toast } from './ui';
import { useSync } from '../lib/sync';
import { send } from '../lib/social';

let ctx: AudioContext | null = null;
export function unlockAudio() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    ctx?.resume();
  } catch { /* audio not available */ }
}
function chime(times = 1) {
  if (!ctx) return;
  try {
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = i % 2 ? 784 : 659;
      const t = ctx.currentTime + i * 0.22;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.4);
    }
  } catch { /* ignore */ }
}
const buzz = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* unsupported (iOS) */ } };

const mmss = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const INTENSITY_COLOR: Record<string, string> = { easy: 'var(--sage)', moderate: 'var(--rose)', hard: 'var(--rose-deep)', rest: 'var(--blush)', work: 'var(--rose)' };

export function WorkoutPlayer() {
  const s = useStore();
  const session = s.session;
  const [now, setNow] = useState(Date.now());
  const [ending, setEnding] = useState(false);
  const [diff, setDiff] = useState<number | undefined>();
  const wake = useRef<any>(null);
  const settings = s.settings;
  const member = useSync((x) => x.member);

  const save = (next: Session | null) => s.set((st) => { st.session = next as any; });

  useEffect(() => {
    if (!session) return;
    const loop = () => {
      const t = Date.now();
      setNow(t);
      const cur = useStore.getState().session;
      if (!cur || cur.pausedAt) return;
      const { s: nx, changed } = tick(cur, t);
      if (changed) {
        save(nx);
        if (settings.sound) chime(isDone(nx) ? 3 : 2);
        if (settings.vibration) buzz(isDone(nx) ? [200, 100, 200] : 200);
      }
    };
    const iv = setInterval(loop, 250);
    document.addEventListener('visibilitychange', loop);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', loop); };
  }, [!!session, settings.sound, settings.vibration]);

  useEffect(() => {
    if (!session) return;
    (async () => { try { wake.current = await (navigator as any).wakeLock?.request('screen'); } catch { /* not supported */ } })();
    return () => { try { wake.current?.release(); } catch { /* */ } };
  }, [!!session]);

  if (!session) return null;
  const done = isDone(session);
  const phase = session.phases[Math.min(session.index, session.phases.length - 1)];
  const el = phaseElapsed(session, now);
  const remaining = phase.kind === 'timed' ? phase.seconds - el : 0;
  const totalSec = session.phases.reduce((a, p) => a + p.seconds, 0);
  const doneSec = session.phases.slice(0, session.index).reduce((a, p) => a + p.seconds, 0) + (done ? 0 : Math.min(el, phase.seconds));
  const next = session.phases[session.index + 1];
  const active = activeElapsed(session, now);
  const name = { strength: 'Full-body strength', 'bike-moderate': 'Moderate bike ride', 'bike-intervals': 'Interval bike ride', 'bike-easy': 'Easy bike ride', walk: 'Lunch walk', other: 'Workout' }[session.workoutId];

  const finish = (completed: boolean) => {
    const actualMin = Math.max(1, Math.round(active / 60));
    s.set((st) => {
      st.workouts.push({ id: uid(), date: session.date, type: session.workoutId, name, plannedMin: Math.round(session.plannedSec / 60), actualMin, completed, difficulty: diff, reps: session.repLog, levels: session.workoutId === 'strength' ? { ...st.exerciseLevels } : undefined, at: Date.now() });
      st.session = null;
    });
    if (completed) { celebrate(); toast('Workout saved — so proud of you ♡'); } else toast('Saved as a partial workout');
  };

  return (
    <div className="fixed inset-0 z-[55] bg-bg flex flex-col safe-top" role="dialog" aria-label="Workout timer">
      <div className="px-5 flex items-center justify-between">
        <div><div className="eyebrow">{name}</div><div className="text-[13px] text-muted tabular-nums">{mmss(active)} active{phase.round ? ` · Round ${phase.round}${session.workoutId === 'strength' ? ' of 2' : ''}` : ''}</div></div>
        <button className="btn-ghost btn-sm" onClick={() => setEnding(true)}><Square size={15} />End</button>
      </div>
      <div className="px-5 mt-3"><Bar pct={(doneSec / totalSec) * 100} h={6} /></div>

      {done ? (
        <div className="flex-1 overflow-y-auto px-6 pt-8 text-center">
          <div className="text-[44px] text-rose">♡</div>
          <h2 className="h-serif text-[28px]">Workout complete</h2>
          <p className="text-muted mt-1">{Math.round(active / 60)} minutes of showing up for yourself.</p>
          <div className="mt-6 text-left"><div className="label">How did it feel? (optional)</div>
            <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((d) => (
              <button key={d} onClick={() => setDiff(d)} className={`rounded-2xl py-3 border ${diff === d ? 'bg-deep text-white border-deep' : 'border-line bg-card'}`}>
                <div className="font-semibold">{d}</div><div className="text-[11px] opacity-80">{['Easy', 'Light', 'Good', 'Hard', 'Max'][d - 1]}</div>
              </button>))}</div>
          </div>
          <button className="btn-primary w-full mt-6" onClick={() => finish(true)}>Save workout</button>
          {member && <button className="btn-soft w-full mt-2" onClick={() => { finish(true); send(`Finished my ${name.toLowerCase()}! 💪`, null, 'achievement', { icon: session.workoutId === 'walk' ? '🚶‍♀️' : session.workoutId.startsWith('bike') ? '🚴‍♀️' : '💪' }).then(() => toast('Shared with the group ♡')).catch(() => toast('Saved — couldn’t share right now')); }}>Save & share with friends</button>}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 flex flex-col items-center pt-4">
          <div className="text-center"><h2 className="h-serif text-[26px] leading-tight">{phase.label}</h2></div>
          <div className="my-2"><ExerciseArt id={phase.exercise ?? (session.workoutId.startsWith('bike') ? 'bike' : 'walk')} size={110} /></div>
          {phase.kind === 'timed' ? (
            <Ring pct={(el / phase.seconds) * 100} size={210} stroke={14} color={INTENSITY_COLOR[phase.intensity]}>
              <div>
                <div className="text-[54px] font-semibold tabular-nums leading-none">{mmss(remaining)}</div>
                <div className="text-[13px] text-muted mt-1 capitalize">{phase.intensity === 'work' ? '' : phase.intensity}</div>
              </div>
            </Ring>
          ) : (
            <div className="text-center">
              <div className="text-muted text-[14px]">Tap to count your reps</div>
              <button aria-label="Count a rep" className="mt-2 w-[200px] h-[200px] rounded-full bg-petal border-[10px] border-blush grid place-items-center active:scale-95 transition"
                onClick={() => save({ ...session, reps: Math.min((phase.reps ?? 12) * 2, session.reps + 1) })}>
                <div><div className="text-[58px] font-semibold tabular-nums leading-none">{session.reps}</div><div className="text-muted">of {phase.reps}</div></div>
              </button>
              <div className="flex justify-center gap-3 mt-3">
                <button aria-label="Remove a rep" className="w-11 h-11 rounded-full bg-card border border-line grid place-items-center" onClick={() => save({ ...session, reps: Math.max(0, session.reps - 1) })}><Minus size={18} /></button>
                <button aria-label="Add a rep" className="w-11 h-11 rounded-full bg-card border border-line grid place-items-center" onClick={() => save({ ...session, reps: session.reps + 1 })}><Plus size={18} /></button>
              </div>
            </div>
          )}
          <p className="text-center text-[15px] mt-4 max-w-[360px]">{phase.cue}</p>
          {next && <p className="text-center text-[13px] text-muted mt-2">Up next: {next.label}</p>}
          {session.pausedAt && <p className="text-center text-deep font-medium mt-2">Paused — take all the time you need.</p>}
        </div>
      )}

      {!done && (
        <div className="px-5 pt-3 pb-4 safe-bottom flex gap-3">
          {phase.kind === 'reps' ? (
            <button className="btn-primary flex-1" onClick={() => { if (settings.sound) chime(1); save(skip(session, Date.now())); }}>Done — next</button>
          ) : session.pausedAt ? (
            <button className="btn-primary flex-1" onClick={() => { unlockAudio(); save(resume(session, Date.now())); }}><Play size={18} />Resume</button>
          ) : (
            <button className="btn-primary flex-1" onClick={() => save(pause(session, Date.now()))}><Pause size={18} />Pause</button>
          )}
          {phase.kind === 'reps' && (session.pausedAt
            ? <button className="btn-soft" onClick={() => save(resume(session, Date.now()))}><Play size={18} /></button>
            : <button aria-label="Take a break" className="btn-soft" onClick={() => save(pause(session, Date.now()))}><Pause size={18} /></button>)}
          <button className="btn-soft" onClick={() => save(skip(session, Date.now()))}><SkipForward size={18} />Skip</button>
        </div>
      )}

      {ending && (
        <Sheet open onClose={() => setEnding(false)} title="End this workout?">
          <p className="text-muted mb-4">You’ve done {Math.round(active / 60)} minutes. Every minute counts.</p>
          <button className="btn-primary w-full mb-2" onClick={() => { setEnding(false); finish(true); }}>Save as completed</button>
          <button className="btn-soft w-full mb-2" onClick={() => { setEnding(false); finish(false); }}>Save as partial</button>
          <button className="btn-ghost w-full" onClick={() => { setEnding(false); save(null); toast('Workout discarded'); }}>Discard</button>
        </Sheet>
      )}
    </div>
  );
}
