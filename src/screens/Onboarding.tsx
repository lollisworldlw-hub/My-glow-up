import { useRef, useState } from 'react';
import { parseBackup, restorePhotos } from '../lib/backup';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../lib/store';
import { DIETS } from '../lib/types';
import type { Diet } from '../lib/types';
import { todayKey, uid, weekStart, weekDays } from '../lib/date';
import { suggestTargets } from '../lib/targets';
import { kgToLb } from '../lib/weight';
import { Field, NumberInput, Segmented, toast } from '../components/ui';
import { AccountForm, inviteFromUrl } from '../components/CloudCard';
import { InstallBanner } from '../components/InstallBanner';

function Shell({ children, back, title, sub, go }: { children: React.ReactNode; back?: string; title: string; sub?: string; go: (s: string) => void }) {
  return (
    <>
    <InstallBanner />
    <div className="min-h-full mx-auto max-w-[560px] px-5 safe-top pb-10">
      {back && <button className="flex items-center gap-1 text-deep font-medium min-h-[44px]" onClick={() => go(back)}><ChevronLeft size={18} />Back</button>}
      <h1 className="h-serif text-[24px] leading-tight mt-2">{title}</h1>
      {sub && <p className="text-muted mt-1 mb-5">{sub}</p>}
      <div className="rise">{children}</div>
    </div>
    </>
  );
}

export default function Onboarding() {
  const s = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(inviteFromUrl() ? 'account' : 'welcome' as string);
  const [name, setName] = useState('');
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
    <Shell go={setStep} title="Welcome to My Glow-Up" sub="A gentle planner for meals, movement, mind, and home — made to feel like a wellness journal, not a calorie app.">
      <div className="grid place-items-center my-8"><img src="/icons/icon-192.png" alt="" className="w-28 h-28 rounded-[28px] shadow-soft" /></div>
      <button className="btn-primary w-full mb-3" onClick={() => setStep('about')}>Create my plan</button>
      <button className="btn-soft w-full" onClick={() => setStep('account')}>I have an account or invite code</button>
      <button className="btn-ghost w-full mt-3" onClick={() => fileRef.current?.click()}>Restore from a backup file</button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = '';
        if (!f) return;
        try { const { state, photos } = await parseBackup(await f.text()); await restorePhotos(photos); s.replaceAll({ ...state, session: null, settings: { ...state.settings, onboarded: true } } as any); toast('Backup restored'); }
        catch (err: any) { toast(err?.message ?? 'Couldn’t read that file'); }
      }} />
    </Shell>
  );

  if (step === 'account') return (
    <Shell go={setStep} back="welcome" title="Your account" sub="Sign in to bring back your data, or use a friend’s invite code to create your account.">
      <AccountForm />
      <button className="btn-ghost w-full mt-5" onClick={() => setStep('about')}>Continue setting up my plan</button>
    </Shell>
  );

  if (step === 'about') return (
    <Shell go={setStep} back="welcome" title="About you" sub="Used only to suggest starting targets. Stays private — never shared with friends.">
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
    <Shell go={setStep} back="about" title="Your movement" sub="We’ll build an easy weekly schedule you can change anytime.">
      <div className="label">Day-to-day activity</div>
      <div className="space-y-2 mb-4">
        {[{ v: 'sedentary', l: 'Mostly sitting', d: 'Desk job, few steps' }, { v: 'light', l: 'Lightly active', d: 'On my feet some of the day' }, { v: 'moderate', l: 'Active', d: 'On my feet most of the day' }].map((o) => (
          <button key={o.v} onClick={() => setActivity(o.v as any)} className={`w-full card p-4 text-left ${activity === o.v ? 'border-rose bg-petal' : ''}`}>
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
    <Shell go={setStep} back="move" title="How you eat" sub="Meals, swaps and new weeks will only use recipes that fit.">
      <div className="flex flex-wrap gap-2 mb-5">
        {DIETS.map((d) => { const on = diets.includes(d.v); return <button key={d.v} className={`chip !py-2.5 !px-4 ${on ? 'chip-on' : ''}`} onClick={() => setDiets(on ? diets.filter((x) => x !== d.v) : [...diets, d.v])}>{d.l}</button>; })}
      </div>
      <Field label="Foods you don’t like (comma separated)"><input className="field" value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="e.g. shrimp, mushrooms" /></Field>
      <button className="btn-primary w-full mt-2" onClick={() => { setCal(sug?.cal ?? null); setPMin(sug?.proteinMin ?? null); setStep('targets'); }}>Next</button>
    </Shell>
  );

  return (
    <Shell go={setStep} back="food" title="Your starting targets" sub="Gentle estimates to begin with — adjust them anytime in Settings. The app never lowers them on its own.">
      {sug && (
        <>
          <div className="card p-5 mb-4">
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
