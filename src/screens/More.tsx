import { useState } from 'react';
import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { useStore } from '../lib/store';
import { useUI } from '../lib/ui';
import { NAV, bottomTabs } from '../lib/nav';
import { Header, Sheet, toast } from '../components/ui';

export default function More() {
  const s = useStore();
  const go = useUI((u) => u.go);
  const [edit, setEdit] = useState(false);
  const bottom = bottomTabs(s.settings.navTabs);
  const rest = NAV.filter((n) => !bottom.includes(n.id));
  return (
    <div>
      <Header eyebrow="Everything else" title="More" />
      <div className="grid grid-cols-2 gap-3">
        {rest.map((n) => {
          const Icon = n.icon;
          return (
            <button key={n.id} className="card p-4 text-left" onClick={() => go(n.id)}>
              <span className="w-11 h-11 rounded-2xl bg-petal text-deep grid place-items-center mb-3"><Icon size={21} /></span>
              <div className="font-semibold">{n.label}</div>
              <div className="text-[14px] text-muted">{n.blurb}</div>
            </button>
          );
        })}
      </div>
      <button className="btn-soft w-full mt-5" onClick={() => setEdit(true)}>Customize the bottom bar</button>
      {edit && <NavEditor onClose={() => setEdit(false)} />}
    </div>
  );
}

export function NavEditor({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [sel, setSel] = useState(bottomTabs(s.settings.navTabs) as string[]);
  const move = (i: number, d: number) => { const a = [...sel]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setSel(a); };
  return (
    <Sheet open onClose={onClose} title="Bottom bar" footer={<button className="btn-primary w-full" disabled={!sel.length} onClick={() => { s.set((x) => { x.settings.navTabs = sel; }); toast('Bottom bar updated'); onClose(); }}>Save</button>}>
      <p className="text-[14px] text-muted mb-3">Pick up to 5 tabs. Everything else lives under “More”.</p>
      <div className="space-y-2">
        {sel.map((id, i) => {
          const n = NAV.find((x) => x.id === id)!;
          return (
            <div key={id} className="card p-3 flex items-center gap-2">
              <button role="checkbox" aria-checked className="w-8 h-8 rounded-full bg-sage text-white grid place-items-center" onClick={() => setSel(sel.filter((x) => x !== id))}><Check size={16} /></button>
              <span className="flex-1 font-medium">{n.label}</span>
              <button aria-label="Move up" className="w-10 h-10 grid place-items-center text-muted" onClick={() => move(i, -1)}><ArrowUp size={17} /></button>
              <button aria-label="Move down" className="w-10 h-10 grid place-items-center text-muted" onClick={() => move(i, 1)}><ArrowDown size={17} /></button>
            </div>
          );
        })}
        {NAV.filter((n) => !sel.includes(n.id)).map((n) => (
          <button key={n.id} disabled={sel.length >= 5} className="w-full card p-3 flex items-center gap-2 text-left disabled:opacity-50" onClick={() => setSel([...sel, n.id])}>
            <span role="checkbox" aria-checked={false} className="w-8 h-8 rounded-full border-2 border-blush" />
            <span className="flex-1">{n.label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
