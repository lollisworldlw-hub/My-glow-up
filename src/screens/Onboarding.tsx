import { useEffect, useRef, useState } from 'react';
import { parseBackup, restorePhotos } from '../lib/backup';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../lib/store';
import { DIETS } from '../lib/types';
import type { Diet } from '../lib/types';
import { todayKey, uid, weekStart, weekDays } from '../lib/date';
import { suggestTargets } from '../lib/targets';
import { kgToLb } from '../lib/weight';
import { Field, NumberInput, Segmented, toast } from '../components/ui';
import { AuthForm, ErrorNote, inviteFromUrl } from '../components/Auth';
import { syncNow, useSync } from '../lib/sync';
import { InstallBanner } from '../components/InstallBanner';

const SETUP = ['about', 'move', 'food', 'targets'];

/** Dark band on top with the title, light page below — same look as the app. */
function Shell({ children, back, title, sub, go, step, wide }: { children: React.ReactNode; back?: string; title: string; sub?: string; go: (s: string) => void; step?: string; wide?: boolean }) {
  const n = step ? SETUP.indexOf(step) : -1;
  return (
    <div className="min-h-full flex flex-col">
      <InstallBanner />
      <div className="band on-dark pt-[calc(env(safe-area-inset-top)+14px)] pb-14">
        <div className="mx-auto max-w-[520px] px-6">
          <div className="h-11 flex items-center justify-between">
            {back ? <button className="flex items-center gap-1 -ml-1.5 min-h-[44px] text-[15px] text-muted" onClick={() => go(back)}><ChevronLeft size={20} />Back</button> : <span />}
            {n >= 0 && <span className="text-[13px] text-muted">Step {n + 1} of {SETUP.length}</span>}
          </div>
          {n >= 0 && <div className="flex gap-1.5 mt-1 mb-5">{SETUP.map((x, i) => <div key={x} className="h-[3px] flex-1 rounded-full" style={{ background: i <= n ? 'var(--accent)' : 'rgba(238,241,236,.15)' }} />)}</div>}
          <h1 className="h-serif text-[34px] leading-[1.08] mt-3">{title}</h1>
          {sub && <p className="text-[15px] text-muted mt-2 leading-relaxed">{sub}</p>}
        </div>
      </div>
      <div className={`mx-auto w-full ${wide ? 'max-w-[560px]' : 'max-w-[520px]'} px-4 -mt-8 pb-10 relative`}>
        <div className="card p-5">{children}</div>
      </div>
    </div>
  );
}

function Restoring({ go }: { go: (s: string) => void }) {
  const { status, member, error } = useSync();
  useEffect(() => { if (status === 'idle' && member) { const t = setTimeout(() => { if (!useStore.getState().settings.onboarded) go('about'); }, 600); return () => clearTimeout(t); } }, [status, member]);
  if (member === false) return <AuthForm />;
  if (status === 'error') return (
    <div>
      <ErrorNote msg={`We couldn’t load your plan: ${error ?? 'unknown error'}`} />
      <button className="btn-primary w-full !min-h-[50px]" onClick={() => syncNow()}>Try again</button>
      <button className="btn-ghost w-full !min-h-[50px] mt-2" onClick={() => go('about')}>Set up a new plan instead</button>
    </div>
  );
  return <div className="py-6 text-center text-muted text-[15px]"><div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-line border-t-ink animate-spin" />Bringing back your plan…</div>;
}

export default function Onboarding() {
  const s = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(inviteFromUrl() ? 'join' : 'welcome' as string);
  const [name, setName] = useState(useStore.getState().settings.name || '');
  const [sex, setSex] = useState<'female' | 'male' | 'other'>('female');
  const [age, setAge] = useState<number | null>(null);
  const [ft, setFt] = useState<number | null>(5);
  const [inch, setInch] = useState<number | null>(5);
  const [unit, setUnit] = useState<'lb' | 'kg'>('lb');
  const [weight, setWeight] = useState<number | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [activity, setActivity] = useState<'sedentary' | 'light' | 'moderate'>('sedentary');
  const [walk, setWalk] = useState<number | null>(20);
  const [home, setHome] = useState<number | null>(20);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [dislikes, setDislikes] = useState('');
  const toLb = (v: number) => (unit === 'kg' ? kgToLb(v) : v);
  const heightIn = (ft ?? 0) * 12 + (inch ?? 0);
  const sug = weight && goal && age ? suggestTargets({ sex, age, heightIn, weightLb: toLb(weight), goalLb: toLb(goal), activity }) : null;
  const [cal, setCal] = useState<number | null>(null);
  const [pMin, setPMin] = useState<number | null>(null);

  const finish = () => {
    if (!sug || !weight || !goal) return;
    const today = todayKey();
    const c = cal ?? sug.cal;
    s.set((x) => {
      Object.assign(x.settings, {
        name: name.trim(), sex, age: age!, heightIn, weightUnit: unit, startWeight: +toLb(weight).toFixed(1), goalWeight: +toLb(goal).toFixed(1),
        activity, walkMinutes: walk ?? 20, workoutMinutes: home ?? 20, diets, dislikes: dislikes.split(',').map((d) => d.trim()).filter(Boolean),
        calTarget: c, calMin: c - 50, calMax: c + 100, proteinMin: pMin ?? sug.proteinMin, proteinMax: Math.max(pMin ?? sug.proteinMin, sug.proteinMax), startDate: today, onboarded: true
      });
      x.weights = [{ id: uid(), date: today, lbs: +toLb(weight).toFixed(2) }];
      x.plans = {};
    });
    s.ensureWeek(weekStart(today));
    s.generateGroceries(weekDays(weekStart(today)));
    toast(`Welcome${name.trim() ? ', ' + name.trim() : ''}`);
  };


  if (step === 'welcome') return (
    <div className="min-h-full flex flex-col">
      <InstallBanner />
      <div className="band on-dark flex-1 min-h-[58vh] flex flex-col justify-end pt-[calc(env(safe-area-inset-top)+40px)] pb-12">
        <div className="mx-auto w-full max-w-[520px] px-7">
          <img src="/icons/icon-192.png" alt="" className="w-16 h-16 rounded-full mb-8" />
          <h1 className="h-serif text-[46px] leading-[1.02]">My Glow-Up</h1>
          <p className="text-[16px] text-muted mt-3 leading-relaxed max-w-[320px]">Meals, movement and calm, planned around you. Better with friends.</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[520px] px-5 pt-7 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <button className="btn-primary w-full !min-h-[54px] !text-[16px]" onClick={() => setStep('join')}>Join with an invite</button>
        <button className="btn-ghost w-full !min-h-[54px] !text-[16px] mt-3" onClick={() => setStep('signin')}>Sign in</button>
        <div className="flex justify-center gap-5 mt-5 text-[13px] text-muted">
          <button className="min-h-[40px]" onClick={() => setStep('about')}>Use without an account</button>
          <button className="min-h-[40px]" onClick={() => fileRef.current?.click()}>Restore a backup</button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = '';
        if (!f) return;
        try { const { state, photos } = await parseBackup(await f.text()); await restorePhotos(photos); s.replaceAll({ ...state, session: null, settings: { ...state.settings, onboarded: true } } as any); toast('Backup restored'); }
        catch (err: any) { toast(err?.message ?? 'Couldn’t read that file'); }
      }} />
    </div>
  );

  if (step === 'join') return (
    <Shell go={setStep} back="welcome" title="Create your account" sub="You’ll need the invite code a friend sent you.">
      <AuthForm key="join" start="join" onSwitch={setStep} onSignedIn={() => setStep('restoring')} />
    </Shell>
  );

  if (step === 'signin') return (
    <Shell go={setStep} back="welcome" title="Welcome back" sub="Sign in and your plan, logs and chats come right back.">
      <AuthForm key="signin" start="signin" onSwitch={setStep} onSignedIn={() => setStep('restoring')} />
    </Shell>
  );

  if (step === 'restoring') return (
    <Shell go={setStep} title="One moment">
      <Restoring go={setStep} />
    </Shell>
  );

  if (step === 'about') return (
    <Shell go={setStep} back="welcome" step="about" title="About you" sub="Used only to suggest starting targets. Stays private — never shared with friends.">
      <Field label="Your first name"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="label">Units</div>
      <div className="mb-4"><Segmented value={unit} onChange={setUnit} options={[{ value: 'lb', label: 'Pounds' }, { value: 'kg', label: 'Kilograms' }]} /></div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Current weight (${unit})`}><NumberInput value={weight} onChange={setWeight} ariaLabel="Current weight" /></Field>
        <Field label={`Goal weight (${unit})`}><NumberInput value={goal} onChange={setGoal} ariaLabel="Goal weight" /></Field>
        <Field label="Height (feet)"><NumberInput value={ft} onChange={setFt} /></Field>
        <Field label="Height (inches)"><NumberInput value={inch} onChange={setInch} /></Field>
        <Field label="Age"><NumberInput value={age} onChange={setAge} ariaLabel="Age" /></Field>
        <Field label="Body for estimates"><select className="field" value={sex} onChange={(e) => setSex(e.target.value as any)}><option value="female">Female</option><option value="male">Male</option><option value="other">Prefer not to say</option></select></Field>
      </div>
      <button className="btn-primary w-full mt-2" disabled={!weight || !goal || !age || heightIn < 48} onClick={() => setStep('move')}>Next</button>
    </Shell>
  );

  if (step === 'move') return (
    <Shell go={setStep} back="about" step="move" title="Your movement" sub="We’ll build an easy weekly schedule you can change anytime.">
      <div className="label">Day-to-day activity</div>
      <div className="space-y-2 mb-4">
        {[{ v: 'sedentary', l: 'Mostly sitting', d: 'Desk job, few steps' }, { v: 'light', l: 'Lightly active', d: 'On my feet some of the day' }, { v: 'moderate', l: 'Active', d: 'On my feet most of the day' }].map((o) => (
          <button key={o.v} onClick={() => setActivity(o.v as any)} className={`w-full rounded-[16px] p-4 text-left border ${activity === o.v ? 'border-ink bg-petal' : 'border-line'}`}>
            <div className="font-medium">{o.l}</div><div className="text-[13px] text-muted">{o.d}</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Daily walk (min)"><NumberInput value={walk} onChange={setWalk} /></Field>
        <Field label="Home workout (min)"><NumberInput value={home} onChange={setHome} /></Field>
      </div>
      <button className="btn-primary w-full mt-2" onClick={() => setStep('food')}>Next</button>
    </Shell>
  );

  if (step === 'food') return (
    <Shell go={setStep} back="move" step="food" title="How you eat" sub="Meals, swaps and new weeks will only use recipes that fit.">
      <div className="flex flex-wrap gap-2 mb-5">
        {DIETS.map((d) => { const on = diets.includes(d.v); return <button key={d.v} className={`chip !py-2.5 !px-4 ${on ? 'chip-on' : ''}`} onClick={() => setDiets(on ? diets.filter((x) => x !== d.v) : [...diets, d.v])}>{d.l}</button>; })}
      </div>
      <Field label="Foods you don’t like (comma separated)"><input className="field" value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="e.g. shrimp, mushrooms" /></Field>
      <button className="btn-primary w-full mt-2" onClick={() => { setCal(sug?.cal ?? null); setPMin(sug?.proteinMin ?? null); setStep('targets'); }}>Next</button>
    </Shell>
  );

  return (
    <Shell go={setStep} back="food" step="targets" title="Your starting targets" sub="Gentle estimates to begin with — adjust them anytime in Settings. The app never lowers them on its own.">
      {sug && (
        <>
          <div className="mb-4">
            <Field label="Daily calories"><NumberInput value={cal} onChange={setCal} ariaLabel="Daily calories" /></Field>
            <Field label="Daily protein, at least (g)"><NumberInput value={pMin} onChange={setPMin} ariaLabel="Daily protein" /></Field>
            <p className="text-[13px] text-muted">Based on an estimated {sug.tdee.toLocaleString()} calories burned per day{toLb(goal!) < toLb(weight!) ? ', with a modest deficit for about 0.5–1 lb a week' : ''}. Protein helps you stay full and keep muscle. This isn’t medical advice — check with your doctor if you have health conditions, are pregnant, or are breastfeeding.</p>
          </div>
          <button className="btn-primary w-full" disabled={!cal || cal < 1000} onClick={finish}>Start my journey</button>
        </>
      )}
    </Shell>
  );
}
