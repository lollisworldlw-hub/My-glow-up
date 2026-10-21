import { ReactNode, useEffect, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { create } from 'zustand';
import { createPortal } from 'react-dom';

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`card p-4 ${className}`}>{children}</div>;
}

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 rise">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="h-serif text-[28px] leading-[1.05]">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-5 mb-2">
      <h2 className="h-serif text-[20px]">{children}</h2>
      {right}
    </div>
  );
}

export function CheckCircle({ on, onToggle, label, size = 26 }: { on: boolean; onToggle: () => void; label: string; size?: number }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`shrink-0 grid place-items-center rounded-full border-2 transition ${on ? 'bg-sage border-sage text-white pop' : 'border-blush bg-card'}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {on && <Check size={size * 0.55} strokeWidth={3} />}
    </button>
  );
}

export function CheckRow({ on, onToggle, title, sub, right }: { on: boolean; onToggle: () => void; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 cursor-pointer" onClick={onToggle}>
      <CheckCircle on={on} onToggle={onToggle} label={title} />
      <div className="flex-1 min-w-0">
        <div className={`text-[15px] ${on ? 'text-muted line-through decoration-blush' : ''}`}>{title}</div>
        {sub && <div className="text-[13px] text-muted">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function Bar({ pct, color = 'var(--rose)', h = 10 }: { pct: number; color?: string; h?: number }) {
  return (
    <div className="w-full rounded-full bg-petal overflow-hidden" style={{ height: h }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

export function Ring({ pct, size = 150, stroke = 12, color = 'var(--rose)', ghostPct = 0, children }:
  { pct: number; size?: number; stroke?: number; color?: string; ghostPct?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(pct), 60); return () => clearTimeout(t); }, [pct]);
  const off = (p: number) => c * (1 - Math.max(0, Math.min(100, p)) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--petal)" strokeWidth={stroke} fill="none" />
        {ghostPct > 0 && <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--blush)" strokeOpacity={0.55} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off(ghostPct)} className="ring-anim" />}
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off(shown)} className="ring-anim" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, small }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; small?: boolean }) {
  return (
    <div className="flex gap-1 p-1 rounded-full bg-petal overflow-x-auto no-scrollbar" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={`flex-1 whitespace-nowrap rounded-full ${small ? 'px-3 min-h-[32px] text-[13px]' : 'px-3 min-h-[36px] text-[14px]'} font-medium transition ${value === o.value ? 'bg-card text-deep shadow-soft' : 'text-muted'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange, step = 0.25, min = 0.25, max = 10, format = (v: number) => String(v) }:
  { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; format?: (v: number) => string }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-petal p-1">
      <button aria-label="Decrease" className="w-9 h-9 rounded-full bg-card grid place-items-center text-deep" onClick={() => onChange(clamp(value - step))}><Minus size={18} /></button>
      <span className="min-w-[56px] text-center font-semibold tabular-nums">{format(value)}</span>
      <button aria-label="Increase" className="w-9 h-9 rounded-full bg-card grid place-items-center text-deep" onClick={() => onChange(clamp(value + step))}><Plus size={18} /></button>
    </div>
  );
}

export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[#392C36]/30 backdrop-blur-[2px] fade" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[90vh] flex flex-col bg-bg rounded-t-[28px] sheet mx-auto max-w-[640px]">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="w-10" />
          <div className="w-10 h-1.5 rounded-full bg-blush" />
          <button aria-label="Close" onClick={onClose} className="w-10 h-10 grid place-items-center rounded-full bg-petal text-deep"><X size={18} /></button>
        </div>
        <h2 className="h-serif text-[22px] px-5 pb-2 leading-tight">{title}</h2>
        <div className="overflow-y-auto px-5 pb-5 flex-1">{children}</div>
        {footer && <div className="px-5 pt-3 pb-4 border-t border-line safe-bottom bg-bg">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block mb-4"><span className="label">{label}</span>{children}</label>;
}

export function NumberInput({ value, onChange, step = 'any', placeholder, ariaLabel }: { value: number | '' | null; onChange: (v: number | null) => void; step?: string; placeholder?: string; ariaLabel?: string }) {
  const [txt, setTxt] = useState(value == null || value === '' ? '' : String(value));
  useEffect(() => { setTxt(value == null || value === '' ? '' : String(value)); }, [value]);
  return (
    <input className="field" inputMode="decimal" type="text" step={step} placeholder={placeholder} aria-label={ariaLabel}
      value={txt}
      onChange={(e) => {
        const t = e.target.value.replace(',', '.');
        if (!/^\d*\.?\d*$/.test(t)) return;
        setTxt(t);
        onChange(t === '' || t === '.' ? null : Number(t));
      }} />
  );
}

export function Empty({ icon, title, sub, action }: { icon: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="mx-auto w-14 h-14 rounded-full bg-petal text-deep grid place-items-center mb-3">{icon}</div>
      <div className="h-serif text-[19px]">{title}</div>
      {sub && <p className="text-muted text-[14px] mt-1 max-w-[300px] mx-auto">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// --- toasts ---
const useToastStore = create<{ msg: string | null; key: number; show: (m: string) => void }>((set) => ({
  msg: null, key: 0, show: (m) => set((s) => ({ msg: m, key: s.key + 1 }))
}));
export const toast = (m: string) => useToastStore.getState().show(m);
export function Toaster() {
  const { msg, key } = useToastStore();
  const [vis, setVis] = useState(false);
  useEffect(() => { if (!msg) return; setVis(true); const t = setTimeout(() => setVis(false), 2400); return () => clearTimeout(t); }, [key, msg]);
  if (!vis || !msg) return null;
  return (
    <div className="fixed left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      <div key={key} className="rise rounded-full bg-ink text-bg px-5 py-3 text-[14px] shadow-soft">{msg}</div>
    </div>
  );
}

// subtle floating hearts celebration
const useCelebrate = create<{ n: number; fire: () => void }>((set) => ({ n: 0, fire: () => set((s) => ({ n: s.n + 1 })) }));
export const celebrate = () => useCelebrate.getState().fire();
export function Celebration() {
  const n = useCelebrate((s) => s.n);
  const [on, setOn] = useState(false);
  useEffect(() => { if (!n) return; setOn(true); const t = setTimeout(() => setOn(false), 2400); return () => clearTimeout(t); }, [n]);
  if (!on) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[70]" key={n}>
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="absolute float-heart text-rose" style={{ left: `${8 + i * 7.5}%`, bottom: '22%', animationDelay: `${(i % 4) * 0.15}s`, fontSize: 18 + (i % 3) * 6 }}>♡</span>
      ))}
    </div>
  );
}
