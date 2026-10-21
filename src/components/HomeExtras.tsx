import { useState } from 'react';
import { CalendarHeart, CheckCheck, ClipboardCheck, Ruler, Camera, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { SLOTS } from '../lib/types';
import { addDays, daysBetween, fmtShort, weekStart, weekday } from '../lib/date';
import { consumed } from '../lib/derived';
import { gramsOf, itemMacros, itemName, macrosForGrams, round } from '../lib/nutrition';
import { cycleStatus, PHASE_NOTE } from '../lib/cycle';
import { useUI } from '../lib/ui';
import { Card, Sheet, toast } from './ui';
import { CheckinSheet } from './Checkin';

export function CycleChip({ today }: { today: string }) {
  const s = useStore();
  const go = useUI((u) => u.go);
  if (!s.settings.cycleOnHome) return null;
  const st = cycleStatus(s.periods, today);
  if (!st) return null;
  const when = st.onPeriod ? `Period day ${st.day}` : st.until > 0 ? `Period expected in ~${st.until} day${st.until === 1 ? '' : 's'}` : st.until === 0 ? 'Period expected today' : `Period expected ~${-st.until} day${st.until === -1 ? '' : 's'} ago`;
  return (
    <button className="w-full card p-4 text-left flex gap-3 items-start" onClick={() => go('progress', 'cycle')}>
      <span className="w-10 h-10 rounded-full bg-petal text-deep grid place-items-center shrink-0"><CalendarHeart size={19} /></span>
      <span className="min-w-0">
        <span className="block font-medium">Cycle day {st.day} · {st.phase}</span>
        <span className="block text-[13px] text-muted">{when}{st.fromData ? '' : ' (estimate until you log 2 cycles)'}</span>
        <span className="block text-[13px] mt-1">{PHASE_NOTE[st.phase]}</span>
      </span>
    </button>
  );
}

export function CheckinCard({ today }: { today: string }) {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const wd = weekday(today);
  const monday = wd === 0 ? weekStart(today) : wd === 1 ? addDays(weekStart(today), -7) : null;
  const last = [...s.checkins].sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
  const showFocus = last && last.focus && daysBetween(last.weekStart, today) <= 14;
  const needs = monday && !s.checkins.some((c) => c.weekStart === monday) && daysBetween(s.settings.startDate, today) >= 3;
  if (!needs && !showFocus) return null;
  return (
    <>
      {needs ? (
        <Card className="bg-petal border-blush">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-card text-deep grid place-items-center shrink-0"><ClipboardCheck size={19} /></span>
            <div className="flex-1">
              <div className="font-semibold">Your weekly check-in</div>
              <p className="text-[13px] text-muted">Two minutes to see your trend, celebrate wins, and pick one focus.</p>
              <button className="btn-primary btn-sm mt-3" onClick={() => setOpen(true)}>Start check-in</button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="rounded-2xl bg-petal px-4 py-3 text-[14px]"><b>This week’s focus:</b> {last!.focus}</div>
      )}
      {open && monday && <CheckinSheet monday={monday} today={today} onClose={() => setOpen(false)} />}
    </>
  );
}

const QUICK: { foodId: string; amount: number; unit: 'each' | 'cup' | 'oz'; label: string }[] = [
  { foodId: 'protein-yogurt', amount: 1, unit: 'each', label: 'Protein yogurt cup' },
  { foodId: 'egg', amount: 2, unit: 'each', label: '2 eggs' },
  { foodId: 'greek-yogurt', amount: 0.75, unit: 'cup', label: '¾ cup Greek yogurt' },
  { foodId: 'chicken-cooked', amount: 3, unit: 'oz', label: '3 oz chicken' },
  { foodId: 'turkey-sausage', amount: 2, unit: 'oz', label: '2 oz turkey sausage' }
];

export function ProteinFixer({ today }: { today: string }) {
  const s = useStore();
  const eaten = consumed(s, today);
  const gap = s.settings.proteinMin - eaten.protein;
  const hour = new Date().getHours();
  if (gap <= 5 || hour < 12) return null;
  const opts = QUICK.map((q) => {
    const f = s.foods[q.foodId];
    if (!f) return null;
    return { ...q, m: round(macrosForGrams(f, gramsOf(f, q.amount, q.unit))) };
  }).filter(Boolean) as (typeof QUICK[number] & { m: ReturnType<typeof round> })[];
  return (
    <div className="mt-4 pt-4 border-t border-line">
      <div className="text-[13px] font-medium mb-2">{Math.round(gap)} g protein to go — quick adds:</div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {opts.map((o) => (
          <button key={o.foodId} className="chip shrink-0 !py-2" onClick={() => {
            s.addLog({ date: today, slot: 'snack', name: o.label, ...o.m });
            toast(`Added ${o.label} · +${o.m.protein} g protein`);
          }}>+{o.m.protein} g · {o.label}</button>
        ))}
      </div>
    </div>
  );
}

export function DessertBudget({ today }: { today: string }) {
  const s = useStore();
  const hour = new Date().getHours();
  const dinnerLogged = (s.plans[today]?.dinner ?? []).some((it) => s.logs.some((l) => l.planItemId === it.id));
  if (hour < 16 && !dinnerLogged) return null;
  const des = s.plans[today]?.dessert?.[0];
  const logged = des && s.logs.find((l) => l.planItemId === des.id);
  if (logged) return null;
  const eaten = consumed(s, today).cal;
  const room = Math.round(s.settings.calTarget - eaten);
  const dCal = des ? Math.round(itemMacros(des, s.recipes, s.foods).cal) : 0;
  const name = des ? itemName(des, s.recipes) : null;
  let msg: string;
  if (!des) msg = room > 120 ? `You have about ${room} calories left — plenty of room for something sweet tonight.` : 'Want something sweet? Pick a dessert — it can fit in your range.';
  else if (room >= dCal) msg = `You have ${room} calories saved for tonight — your ${name} (${dCal}) fits with ${room - dCal} to spare ♡`;
  else if (room + (s.settings.calMax - s.settings.calTarget) >= dCal) msg = `Your ${name} (${dCal}) still fits within your flexible range tonight. Enjoy it ♡`;
  else msg = `Tonight a half portion of your ${name} (about ${Math.round(dCal / 2)} cal) keeps you near your range — or enjoy it fully; one day doesn’t change your trend.`;
  return (
    <div className="rounded-3xl border border-blush bg-petal px-4 py-3 flex gap-3 items-start">
      <Sparkles size={18} className="text-deep mt-0.5 shrink-0" />
      <p className="text-[14px]">{msg}</p>
    </div>
  );
}

export function LogDayButton({ today }: { today: string }) {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const day = s.plans[today];
  if (!day) return null;
  const pending = SLOTS.flatMap((slot) => (day[slot] ?? []).filter((it) => { const l = s.logs.find((x) => x.planItemId === it.id); return !l || l.prelogged; }).map((it) => ({ slot, it })));
  if (pending.length < 2) return null;
  return (
    <>
      <button className="btn-soft w-full" onClick={() => setOpen(true)}><CheckCheck size={18} />I ate everything as planned</button>
      {open && (
        <Sheet open onClose={() => setOpen(false)} title="Log the whole day?" footer={
          <button className="btn-primary w-full" onClick={() => {
            for (const p of pending) s.logItem(today, p.slot, p.it.id);
            toast(`Logged ${pending.length} meals ♡`); setOpen(false);
          }}>Log all {pending.length}</button>}>
          <p className="text-muted text-[14px] mb-3">These will be logged at their planned portions. Ate something differently? Close this and log that one meal instead.</p>
          {pending.map((p) => {
            const m = round(itemMacros(p.it, s.recipes, s.foods));
            return <div key={p.it.id} className="flex justify-between py-2.5 border-b border-line"><span>{itemName(p.it, s.recipes)}</span><span className="text-muted tabular-nums">{m.cal} cal</span></div>;
          })}
        </Sheet>
      )}
    </>
  );
}

export function CheckReminders({ today }: { today: string }) {
  const s = useStore();
  const go = useUI((u) => u.go);
  const items: { key: string; icon: JSX.Element; title: string; sub: string; action: () => void }[] = [];
  const lastM = [...s.measures].sort((a, b) => b.date.localeCompare(a.date))[0];
  const startedDays = daysBetween(s.settings.startDate, today);
  if ((!lastM && startedDays >= 0) || (lastM && daysBetween(lastM.date, today) >= 14))
    items.push({ key: 'measure', icon: <Ruler size={18} />, title: lastM ? 'Time for a waist check' : 'Take your starting measurements', sub: lastM ? `Last measured ${fmtShort(lastM.date)}. Your waist often changes before the scale.` : 'Waist at the belly button is the one to watch.', action: () => go('progress', 'body') });
  const lastP = [...s.photos].sort((a, b) => b.date.localeCompare(a.date))[0];
  if ((!lastP && startedDays >= 0) || (lastP && daysBetween(lastP.date, today) >= 30))
    items.push({ key: 'photo', icon: <Camera size={18} />, title: lastP ? 'Monthly progress photos' : 'Take your “day one” photos', sub: 'Private, on this phone only. Same spot and light each time.', action: () => go('progress', 'photos') });
  const visible = items.filter((i) => !(s.snoozes[i.key] && s.snoozes[i.key] > today));
  if (!visible.length) return null;
  return (
    <div className="space-y-2">
      {visible.map((i) => (
        <div key={i.key} className="card p-4 flex gap-3 items-start">
          <span className="w-10 h-10 rounded-full bg-petal text-deep grid place-items-center shrink-0">{i.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{i.title}</div>
            <div className="text-[13px] text-muted">{i.sub}</div>
            <div className="flex gap-2 mt-2">
              <button className="btn-primary btn-sm" onClick={i.action}>Do it now</button>
              <button className="btn-ghost btn-sm" onClick={() => s.set((x) => { x.snoozes[i.key] = addDays(today, 3); })}>Later</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
