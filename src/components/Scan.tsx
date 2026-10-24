import { useEffect, useRef, useState } from 'react';
import { ScanLine } from 'lucide-react';
import type { Food, Macros } from '../lib/types';
import { useStore } from '../lib/store';
import { uid } from '../lib/date';
import { NumberInput } from './ui';

export interface Product { code: string; name: string; brand: string; per100g: Macros; servingG: number | null; servingLabel: string }

/** Look a barcode up in Open Food Facts (free, worldwide product database). */
export async function lookupBarcode(code: string): Promise<Product | null> {
  const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity`);
  if (!r.ok) return null;
  const j = await r.json();
  if (j.status !== 1 || !j.product) return null;
  const p = j.product, n = p.nutriments ?? {};
  let cal = n['energy-kcal_100g'];
  if (cal == null && n['energy_100g'] != null) cal = n['energy_100g'] / 4.184;
  if (cal == null) return null;
  const sq = Number(p.serving_quantity);
  return {
    code,
    name: (p.product_name || 'Scanned item').trim(),
    brand: (p.brands || '').split(',')[0].trim(),
    per100g: { cal: +(+cal).toFixed(1), protein: +(+(n.proteins_100g ?? 0)).toFixed(1), carbs: +(+(n.carbohydrates_100g ?? 0)).toFixed(1), fat: +(+(n.fat_100g ?? 0)).toFixed(1) },
    servingG: sq > 0 ? sq : null,
    servingLabel: p.serving_size || ''
  };
}

/** Save a scanned product to the food library so it shows up in search next time. */
export function saveProductAsFood(p: Product): string {
  const s = useStore.getState();
  const existing = Object.values(s.foods).find((f) => f.note === `barcode:${p.code}`);
  if (existing) return existing.id;
  const id = uid();
  const food: Food = {
    id, name: p.brand ? `${p.name} (${p.brand})` : p.name, state: 'packaged', category: 'Pantry', per100g: p.per100g,
    units: p.servingG ? { each: p.servingG } : {}, eachLabel: p.servingG ? 'serving' : undefined, estimate: false, note: `barcode:${p.code}`,
    grocery: { key: id, name: p.name, factor: 1, unitLabel: p.servingG ? 'servings' : 'g', gramsPerUnit: p.servingG ?? 1, round: 'ceil' }, custom: true, tags: []
  } as Food;
  s.set((x) => { x.foods[id] = food; });
  return id;
}

/** Live camera scanner with a typed-in fallback. */
export function BarcodeScanner({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState('');
  const [typed, setTyped] = useState('');
  useEffect(() => {
    let stop: (() => void) | null = null;
    let done = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        const ctrl = await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video.current!, (res) => {
          if (res && !done) { done = true; navigator.vibrate?.(40); onCode(res.getText()); }
        });
        stop = () => ctrl.stop();
        if (done) stop();
      } catch {
        setErr('Camera isn’t available. Allow camera access for this app in Settings, or type the barcode number below.');
      }
    })();
    return () => { done = true; stop?.(); };
  }, []);
  return (
    <div>
      {!err ? (
        <div className="relative rounded-[18px] overflow-hidden bg-black aspect-[4/3] mb-3">
          <video ref={video} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 rounded-[12px] border-2 border-white/80" />
          <div className="absolute bottom-2 inset-x-0 text-center text-white/85 text-[13px]">Point at the barcode</div>
        </div>
      ) : <p className="text-[13px] text-muted mb-3">{err}</p>}
      <div className="flex gap-2">
        <input className="field flex-1" inputMode="numeric" placeholder="Or type the barcode number" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, ''))} />
        <button className="btn-soft" disabled={typed.length < 6} onClick={() => onCode(typed)}><ScanLine size={16} />Look up</button>
      </div>
    </div>
  );
}

/** Pick how much of a scanned product was eaten. */
export function ProductAmount({ p, onChange }: { p: Product; onChange: (m: Macros & { label: string }) => void }) {
  const [mode, setMode] = useState<'serving' | 'g'>(p.servingG ? 'serving' : 'g');
  const [amt, setAmt] = useState<number | null>(p.servingG ? 1 : 100);
  const grams = mode === 'serving' ? (amt ?? 0) * (p.servingG ?? 0) : amt ?? 0;
  const k = grams / 100;
  const m = { cal: Math.round(p.per100g.cal * k), protein: Math.round(p.per100g.protein * k), carbs: Math.round(p.per100g.carbs * k), fat: Math.round(p.per100g.fat * k) };
  useEffect(() => { onChange({ ...m, label: mode === 'serving' ? `${amt} serving${amt === 1 ? '' : 's'}` : `${amt} g` }); }, [grams]);
  return (
    <div className="rounded-[16px] border border-line p-3.5">
      <div className="font-medium">{p.name}</div>
      <div className="text-[13px] text-muted">{p.brand}{p.servingLabel ? `${p.brand ? ', ' : ''}serving ${p.servingLabel}` : ''}</div>
      <div className="flex gap-2 mt-3 items-end">
        <div className="w-24"><NumberInput value={amt} onChange={setAmt} ariaLabel="Amount" /></div>
        <select className="field flex-1" value={mode} onChange={(e) => { const v = e.target.value as 'serving' | 'g'; setMode(v); setAmt(v === 'serving' ? 1 : 100); }}>
          {p.servingG && <option value="serving">servings</option>}
          <option value="g">grams</option>
        </select>
      </div>
      <div className="mt-3 text-[14px]"><b>{m.cal} cal</b>, {m.protein} g protein, {m.carbs} g carbs, {m.fat} g fat</div>
    </div>
  );
}
