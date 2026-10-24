import { ReactNode, useEffect, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { create } from 'zustand';
import { createPortal } from 'react-dom';

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`card p-3 ${className}`}>{children}</div>;
}

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-2 mb-3 pt-1">
      <div className="min-w-0">
        <h1 className="h-serif text-[26px] leading-[1.05]">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-3 mb-2">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{children}</h2>
      {right}
    </div>
  );
}

export function CheckCircle({ on, onToggle, label, size = 22 }: { on: boolean; onToggle: () => void; label: string; size?: number }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`shrink-0 grid place-items-center rounded-full border transition-colors ${on ? 'bg-deep border-deep text-bg' : 'border-[1.5px] border-blush bg-card'}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {on && <Check size={size * 0.55} strokeWidth={2.5} />}
    </button>
  );
}

export function CheckRow({ on, onToggle, title, sub, right }: { on: boolean; onToggle: () => void; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 cursor-pointer" onClick={onToggle}>
      <CheckCircle on={on} onToggle={onToggle} label={title} />
      <div className="flex-1 min-w-0">
        <div className={`text-[14px] ${on ? 'text-muted' : ''}`}>{title}</div>
        {sub && <div className="text-[13px] text-muted">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function Bar({ pct, color = 'var(--rose)', h = 4 }: { pct: number; color?: string; h?: number }) {
  return (
    <div className="w-full rounded-full bg-petal overflow-hidden" style={{ height: h }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

export function Ring({ pct, size = 150, stroke = 6, color = 'var(--rose)', ghostPct = 0, children }:
  { pct: number; size?: number; stroke?: number; color?: string; ghostPct?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(pct), 60); return () => clearTimeout(t); }, [pct]);
  const off = (p: number) => c * (1 - Math.max(0, Math.min(100, p)) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs><linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" style={{ stopColor: 'var(--accent-light)' }} /><stop offset="100%" style={{ stopColor: 'var(--accent-2)' }} /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--petal)" strokeWidth={stroke} fill="none" />
        {ghostPct > 0 && <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--blush)" strokeOpacity={0.9} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off(ghostPct)} className="ring-anim" />}
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off(shown)} className="ring-anim" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, small }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; small?: boolean }) {
  return (
    <div className="flex gap-4 border-b border-line overflow-x-auto no-scrollbar" role="tablist">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} role="tab" aria-selected={on} onClick={() => onChange(o.value)}
            className={`relative whitespace-nowrap ${small ? 'text-[13px] pb-2 pt-1' : 'text-[14px] pb-2.5 pt-1'} font-medium transition-colors ${on ? 'text-ink' : 'text-muted hover:text-ink'}`}>
            {o.label}
            <span className={`absolute left-0 right-0 -bottom-px h-[2px] rounded-full transition-opacity ${on ? 'bg-ink opacity-100' : 'opacity-0'}`} />
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, step = 0.25, min = 0.25, max = 10, format = (v: number) => String(v) }:
  { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; format?: (v: number) => string }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <div className="inline-flex items-center rounded-[10px] border border-line bg-card">
      <button aria-label="Decrease" className="w-9 h-9 grid place-items-center text-ink" onClick={() => onChange(clamp(value - step))}><Minus size={16} strokeWidth={1.75} /></button>
      <span className="min-w-[48px] text-center font-medium tabular-nums border-x border-line leading-9">{format(value)}</span>
      <button aria-label="Increase" className="w-9 h-9 grid place-items-center text-ink" onClick={() => onChange(clamp(value + step))}><Plus size={16} strokeWidth={1.75} /></button>
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
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 fade" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[90vh] flex flex-col bg-bg rounded-t-[20px] sheet mx-auto max-w-[640px]">
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
          <h2 className="h-serif text-[19px] leading-tight pt-1.5">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="w-9 h-9 shrink-0 grid place-items-center rounded-full text-muted hover:bg-petal"><X size={18} strokeWidth={1.75} /></button>
        </div>
        <div className="overflow-y-auto px-4 pb-5 flex-1">{children}</div>
        {footer && <div className="px-4 pt-3 pb-4 border-t border-line safe-bottom bg-bg">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block mb-3"><span className="label">{label}</span>{children}</label>;
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
      <div className="mx-auto w-11 h-11 rounded-full border border-line text-muted grid place-items-center mb-3">{icon}</div>
      <div className="text-[15px] font-semibold">{title}</div>
      {sub && <p className="text-muted text-[14px] mt-1 max-w-[300px] mx-auto">{sub}</p>}
      {action && <div className="mt-3">{action}</div>}
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
    <div className="fixed left-0 right-0 z-[75] flex justify-center px-4 pointer-events-none" style={{ bottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
      <div key={key} className="fade toast rounded-[10px] bg-ink text-bg px-4 py-2.5 text-[13.5px] shadow-soft">{msg}</div>
    </div>
  );
}

// celebrations are intentionally quiet: the toast carries the moment
export const celebrate = () => {};
export function Celebration() { return null; }
