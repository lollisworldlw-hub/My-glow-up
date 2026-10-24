import { useState } from 'react';
import { useStore } from '../lib/store';
import { todayKey, uid } from '../lib/date';
import { Field, NumberInput, Sheet, celebrate, toast } from './ui';
import { kgToLb, lbToKg } from '../lib/weight';

export const MILESTONES = [175, 170, 165, 160, 155, 150];

export const showW = (lbs: number, unit: 'lb' | 'kg') => unit === 'kg' ? `${lbToKg(lbs).toFixed(1)} kg` : `${(+lbs.toFixed(1))} lbs`;
export const wNum = (lbs: number, unit: 'lb' | 'kg') => unit === 'kg' ? +lbToKg(lbs).toFixed(1) : +lbs.toFixed(1);

export function WeightSheet({ onClose, entryId }: { onClose: () => void; entryId?: string }) {
  const s = useStore();
  const unit = s.settings.weightUnit;
  const existing = entryId ? s.weights.find((w) => w.id === entryId) : undefined;
  const [date, setDate] = useState(existing?.date ?? todayKey());
  const [val, setVal] = useState<number | null>(existing ? wNum(existing.lbs, unit) : null);

  const save = () => {
    if (val == null || val <= 0) return;
    const lbs = unit === 'kg' ? kgToLb(val) : val;
    const before = Math.min(s.settings.startWeight, ...s.weights.map((w) => w.lbs));
    s.set((st) => {
      if (existing) {
        const e = st.weights.find((w) => w.id === existing.id);
        if (e) { e.date = date; e.lbs = +lbs.toFixed(2); }
      } else {
        const same = st.weights.find((w) => w.date === date);
        if (same) same.lbs = +lbs.toFixed(2);
        else st.weights.push({ id: uid(), date, lbs: +lbs.toFixed(2) });
      }
    });
    const crossed = MILESTONES.filter((m) => lbs <= m && before > m);
    if (crossed.length) { celebrate(); toast(`Milestone reached: ${crossed[crossed.length - 1]} lbs`); }
    else toast('Weigh-in saved');
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={existing ? 'Edit weigh-in' : 'Log your weight'}
      footer={
        <div className="flex gap-2">
          {existing && <button className="btn-ghost flex-1" onClick={() => { s.set((st) => { st.weights = st.weights.filter((w) => w.id !== existing.id); }); toast('Weigh-in deleted'); onClose(); }}>Delete</button>}
          <button className="btn-primary flex-[2]" disabled={val == null || val <= 0} onClick={save}>Save</button>
        </div>
      }>
      <p className="text-muted text-[14px] mb-3">Weight naturally moves day to day with water, salt, and hormones. The weekly trend is what matters.</p>
      <Field label={`Weight (${unit === 'kg' ? 'kg' : 'lbs'})`}><NumberInput value={val} onChange={setVal} placeholder={unit === 'kg' ? '80.7' : '178'} ariaLabel="Weight" /></Field>
      <Field label="Date"><input type="date" className="field" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
    </Sheet>
  );
}
