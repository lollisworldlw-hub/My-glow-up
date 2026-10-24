import { useEffect, useState } from 'react';
import { Check, Flag, Plus, Trophy } from 'lucide-react';
import { useChallenges, loadChallenges, postMyDays, createChallenge, joinChallenge, leaveChallenge, endChallenge, toggleCheckin, TEMPLATES, type Challenge, type Metric } from '../lib/challenges';
import { useSocial } from '../lib/social';
import { addDays, daysBetween, fmtShort, todayKey, weekStart } from '../lib/date';
import { NumberInput, Sheet, toast } from './ui';
import { Avatar } from '../screens/Social';

export function Challenges({ me }: { me: string }) {
  const { list, joined, days, loaded, error } = useChallenges();
  const members = useSocial((s) => s.members);
  const [creating, setCreating] = useState(false);
  const today = todayKey();
  useEffect(() => { loadChallenges().then(postMyDays); }, []);

  if (!loaded) return <p className="text-muted">Loading…</p>;
  if (error === 'setup') return <div className="card p-5"><div className="font-semibold">Challenges are almost ready</div><p className="text-[14px] text-muted mt-1">The group admin needs to finish a one-time setup.</p></div>;
  if (error) return <div className="card p-5"><p className="text-[14px]">{error}</p><button className="btn-soft btn-sm mt-3" onClick={loadChallenges}>Try again</button></div>;

  const active = list.filter((c) => c.end_date >= today);
  const done = list.filter((c) => c.end_date < today);

  return (
    <div className="space-y-3">
      <button className="btn-primary w-full !min-h-[48px]" onClick={() => setCreating(true)}><Plus size={18} />Start a challenge</button>
      {!active.length && <div className="card p-5 text-center"><Flag size={22} strokeWidth={1.6} className="mx-auto mb-2 text-muted" /><div className="font-medium">No challenges yet</div><p className="text-[14px] text-muted mt-1">Start one and invite the group. Only “hit it or not” is shared, never your numbers.</p></div>}
      {active.map((c) => <ChallengeCard key={c.id} c={c} me={me} joined={joined} days={days} members={members} />)}
      {done.length > 0 && <div className="text-[13px] text-muted px-1 pt-2">Finished</div>}
      {done.map((c) => <ChallengeCard key={c.id} c={c} me={me} joined={joined} days={days} members={members} finished />)}
      {creating && <CreateSheet onClose={() => setCreating(false)} />}
    </div>
  );
}

function ChallengeCard({ c, me, joined, days, members, finished }: { c: Challenge; me: string; joined: { challenge_id: number; user_id: string }[]; days: { challenge_id: number; user_id: string; day: string }[]; members: Record<string, any>; finished?: boolean }) {
  const today = todayKey();
  const started = today >= c.start_date;
  const total = daysBetween(c.start_date, c.end_date) + 1;
  const sofar = finished ? total : started ? Math.min(total, daysBetween(c.start_date, today) + 1) : 0;
  const people = joined.filter((j) => j.challenge_id === c.id).map((j) => ({ id: j.user_id, hits: days.filter((d) => d.challenge_id === c.id && d.user_id === j.user_id).length, today: days.some((d) => d.challenge_id === c.id && d.user_id === j.user_id && d.day === today) }))
    .sort((a, b) => b.hits - a.hits);
  const inIt = people.some((p) => p.id === me);
  const blurb = TEMPLATES.find((t) => t.metric === c.metric)?.blurb ?? '';
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<void>, ok?: string) => { setBusy(true); try { await fn(); if (ok) toast(ok); } catch (e: any) { toast(e?.message ?? 'That didn’t work'); } setBusy(false); };
  const myToday = people.find((p) => p.id === me)?.today;
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="h-serif text-[20px] leading-tight">{c.title}</div>
          <div className="text-[13px] text-muted mt-0.5">{finished ? `Ended ${fmtShort(c.end_date)}` : started ? `Day ${sofar} of ${total}, ends ${fmtShort(c.end_date)}` : `Starts ${fmtShort(c.start_date)}, ${total} days`}</div>
        </div>
        {finished && people[0]?.hits > 0 && <Trophy size={20} className="text-gold shrink-0" />}
      </div>
      {!finished && <p className="text-[13px] text-muted mt-2">{blurb}</p>}
      {people.length > 0 && (
        <div className="mt-3 divide-y divide-line">
          {people.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2">
              <span className="w-5 text-[13px] text-muted tabular-nums">{i + 1}</span>
              <Avatar member={members[p.id]} size={30} />
              <span className="flex-1 text-[14px] truncate">{members[p.id]?.display_name ?? 'Friend'}{p.id === me ? ' (you)' : ''}</span>
              {!finished && p.today && <span className="w-5 h-5 rounded-full grid place-items-center" style={{ background: 'var(--sage)' }}><Check size={12} color="#fff" strokeWidth={3} /></span>}
              <span className="text-[13px] tabular-nums w-[74px] text-right">{p.hits} of {sofar || total} days</span>
            </div>
          ))}
        </div>
      )}
      {!finished && (
        <div className="flex gap-2 mt-3">
          {!inIt && <button className="btn-primary flex-1" disabled={busy} onClick={() => act(() => joinChallenge(c.id), 'You’re in')}>Join</button>}
          {inIt && c.metric === 'checkin' && started && (
            <button className={myToday ? 'btn-soft flex-1' : 'btn-primary flex-1'} disabled={busy} onClick={() => act(() => toggleCheckin(c.id, today, !myToday), myToday ? undefined : 'Checked in')}>
              <Check size={16} />{myToday ? 'Checked in today' : 'Check in for today'}
            </button>
          )}
          {inIt && <button className="btn-ghost" disabled={busy} onClick={() => act(() => (c.created_by === me && people.length <= 1 ? endChallenge(c.id) : leaveChallenge(c.id)), 'Left the challenge')}>Leave</button>}
        </div>
      )}
    </div>
  );
}

function CreateSheet({ onClose }: { onClose: () => void }) {
  const [pick, setPick] = useState<number>(0);
  const t = TEMPLATES[pick];
  const [title, setTitle] = useState(t.title);
  const [goal, setGoal] = useState<number | null>(t.goal);
  const [len, setLen] = useState(t.days);
  const [when, setWhen] = useState<'today' | 'monday'>('today');
  const [busy, setBusy] = useState(false);
  const choose = (i: number) => { setPick(i); setTitle(TEMPLATES[i].title); setGoal(TEMPLATES[i].goal); setLen(TEMPLATES[i].days); };
  const start = when === 'today' ? todayKey() : addDays(weekStart(todayKey()), 7);
  const name = t.metric === 'steps' && goal ? (title === TEMPLATES[0].title ? `${(goal / 1000).toLocaleString()}k steps a day` : title) : title;
  return (
    <Sheet open onClose={onClose} title="Start a challenge"
      footer={<button className="btn-primary w-full" disabled={busy || !name.trim() || (t.metric === 'steps' && !goal)} onClick={async () => {
        setBusy(true);
        try { await createChallenge({ title: name, metric: t.metric as Metric, goal: t.metric === 'steps' ? goal : null, start, days: len }); toast('Challenge started. The group can join now.'); onClose(); }
        catch (e: any) { toast(e?.message ?? 'Couldn’t start it'); }
        setBusy(false);
      }}>{busy ? 'Starting…' : 'Start challenge'}</button>}>
      <div className="space-y-2 mb-4">
        {TEMPLATES.map((x, i) => (
          <button key={i} onClick={() => choose(i)} className={`w-full text-left rounded-[16px] border p-3 ${pick === i ? 'border-ink bg-petal' : 'border-line'}`}>
            <div className="text-[15px] font-medium">{x.title || 'Your own challenge'}</div>
            <div className="text-[13px] text-muted">{x.blurb}</div>
          </button>
        ))}
      </div>
      {t.metric === 'checkin' && <label className="block mb-3"><span className="label">Challenge name</span><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. No sugar" /></label>}
      {t.metric === 'steps' && <label className="block mb-3"><span className="label">Steps per day</span><NumberInput value={goal} onChange={setGoal} ariaLabel="Steps per day" /></label>}
      <div className="label">How long</div>
      <div className="flex gap-2 mb-3">{[7, 14, 21, 30].map((d) => <button key={d} className={`chip !py-2 !px-4 ${len === d ? 'chip-on' : ''}`} onClick={() => setLen(d)}>{d} days</button>)}</div>
      <div className="label">Start</div>
      <div className="flex gap-2">{([['today', 'Today'], ['monday', 'Next Monday']] as const).map(([v, l]) => <button key={v} className={`chip !py-2 !px-4 ${when === v ? 'chip-on' : ''}`} onClick={() => setWhen(v)}>{l}</button>)}</div>
    </Sheet>
  );
}
