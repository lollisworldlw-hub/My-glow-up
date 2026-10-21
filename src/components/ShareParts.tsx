import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Share2, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import type { Recipe, Slot } from '../lib/types';
import { SLOT_LABEL, SLOTS } from '../lib/types';
import { useSync } from '../lib/sync';
import { send } from '../lib/social';
import { uploadMedia } from '../lib/media';
import { recipePayload } from '../lib/recipeShare';
import { deletePhoto, loadPhoto, resizeImage, savePhoto } from '../lib/backup';
import { uid } from '../lib/date';
import { useUI } from '../lib/ui';
import { Field, Sheet, toast } from './ui';

export function useCanShare() {
  const { member } = useSync();
  const go = useUI((u) => u.go);
  return (): boolean => {
    if (member) return true;
    toast('Join the group in the Social tab to share');
    go('social');
    return false;
  };
}

function PhotoPicker({ file, setFile, label = 'Add a photo (optional)' }: { file: File | null; setFile: (f: File | null) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string>();
  useEffect(() => { if (!file) { setUrl(undefined); return; } const u = URL.createObjectURL(file); setUrl(u); return () => URL.revokeObjectURL(u); }, [file]);
  return (
    <div className="mb-4">
      {url ? (
        <div className="relative">
          <img src={url} alt="" className="w-full max-h-72 object-cover rounded-2xl" />
          <button className="absolute top-2 right-2 btn-ghost btn-sm" onClick={() => setFile(null)}>Remove</button>
        </div>
      ) : (
        <button className="w-full rounded-2xl border-2 border-dashed border-blush py-6 text-deep font-medium flex items-center justify-center gap-2" onClick={() => ref.current?.click()}><ImagePlus size={18} />{label}</button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ''; }} />
    </div>
  );
}

export function ShareRecipeSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const s = useStore();
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const share = async () => {
    setBusy(true);
    try {
      const image = file ? await uploadMedia(file) : undefined;
      await send(note.trim() || `Sharing my recipe: ${recipe.name}`, null, 'recipe', { payload: recipePayload(recipe, s.foods), image });
      toast('Recipe shared with the group ♡');
      onClose();
    } catch (e: any) { toast(e?.message ?? 'Couldn’t share right now'); }
    setBusy(false);
  };
  return (
    <Sheet open onClose={onClose} title={`Share “${recipe.name}”`} footer={<button className="btn-primary w-full" disabled={busy} onClick={share}><Share2 size={17} />{busy ? 'Sharing…' : 'Share to the group'}</button>}>
      <p className="text-[13px] text-muted mb-3">Friends see the ingredients, steps, and nutrition, and can save it to their own recipes with one tap.</p>
      <PhotoPicker file={file} setFile={setFile} />
      <Field label="Add a note (optional)"><input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="So easy and so good!" /></Field>
    </Sheet>
  );
}

/** Today's food photos: kept privately on this phone, shareable to the group. */
export function FoodPhotos({ date }: { date: string }) {
  const s = useStore();
  const list = s.foodPhotos.filter((p) => p.date === date);
  const ref = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Food photos</div>
        <button className="btn-soft btn-sm" onClick={() => ref.current?.click()}><Camera size={16} />Add</button>
      </div>
      {list.length === 0 ? <p className="text-[13px] text-muted">Snap what you ate — a lovely visual diary. Photos stay on your phone unless you share one.</p> : (
        <div className="grid grid-cols-3 gap-2">
          {list.map((p) => <button key={p.id} onClick={() => setOpen(p.id)} className="relative"><LocalImg id={p.id} className="w-full aspect-square rounded-xl" />{p.sharedAt && <span className="absolute bottom-1 right-1 text-[11px] bg-black/45 text-white rounded-full px-1.5">Shared</span>}</button>)}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { setPending(e.target.files?.[0] ?? null); e.target.value = ''; }} />
      {pending && <AddFoodPhoto file={pending} date={date} onClose={() => setPending(null)} />}
      {open && <FoodPhotoSheet id={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

export function LocalImg({ id, className = '' }: { id: string; className?: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let u: string | undefined; let alive = true;
    loadPhoto(id).then((b) => { if (b && alive) { u = URL.createObjectURL(b); setUrl(u); } });
    return () => { alive = false; if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url ? <img src={url} alt="" className={`object-cover ${className}`} /> : <div className={`bg-petal ${className}`} />;
}

const guessSlot = (): Slot => { const h = new Date().getHours(); return h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 17 ? 'snack' : h < 20 ? 'dinner' : 'dessert'; };

function AddFoodPhoto({ file, date, onClose }: { file: File; date: string; onClose: () => void }) {
  const s = useStore();
  const canShare = useCanShare();
  const [slot, setSlot] = useState<Slot>(guessSlot());
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string>();
  useEffect(() => { const u = URL.createObjectURL(file); setUrl(u); return () => URL.revokeObjectURL(u); }, [file]);
  const save = async (share: boolean) => {
    if (share && !canShare()) return;
    setBusy(true);
    try {
      const { blob, w, h } = await resizeImage(file);
      const id = uid();
      await savePhoto(id, blob);
      let sharedAt: number | undefined;
      if (share) {
        const image = await uploadMedia(blob);
        await send(caption.trim() || `My ${SLOT_LABEL[slot].toLowerCase()} today`, null, 'photo', { image, slot });
        sharedAt = Date.now();
      }
      s.set((x) => { x.foodPhotos.push({ id, date, slot, caption: caption.trim(), w, h, sharedAt }); });
      toast(share ? 'Saved and shared ♡' : 'Saved to today’s food photos');
      onClose();
    } catch (e: any) { toast(e?.message ?? 'Couldn’t save that photo'); }
    setBusy(false);
  };
  return (
    <Sheet open onClose={onClose} title="New food photo" footer={<div className="flex gap-2">
      <button className="btn-soft flex-1" disabled={busy} onClick={() => save(false)}>Save</button>
      <button className="btn-primary flex-[1.4]" disabled={busy} onClick={() => save(true)}><Share2 size={16} />{busy ? 'One moment…' : 'Save & share'}</button></div>}>
      {url && <img src={url} alt="" className="w-full max-h-72 object-cover rounded-2xl mb-4" />}
      <Field label="Meal"><select className="field" value={slot} onChange={(e) => setSlot(e.target.value as Slot)}>{SLOTS.map((x) => <option key={x} value={x}>{SLOT_LABEL[x]}</option>)}</select></Field>
      <Field label="Caption (optional)"><input className="field" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Meal-prepped chicken bowl!" /></Field>
    </Sheet>
  );
}

function FoodPhotoSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const s = useStore();
  const canShare = useCanShare();
  const p = s.foodPhotos.find((x) => x.id === id);
  const [busy, setBusy] = useState(false);
  if (!p) return null;
  const share = async () => {
    if (!canShare()) return;
    setBusy(true);
    try {
      const blob = await loadPhoto(id);
      if (!blob) throw new Error('Photo not found on this phone');
      const image = await uploadMedia(blob);
      await send(p.caption || `My ${p.slot ? SLOT_LABEL[p.slot].toLowerCase() : 'food'} today`, null, 'photo', { image, slot: p.slot });
      s.set((x) => { const f = x.foodPhotos.find((y) => y.id === id); if (f) f.sharedAt = Date.now(); });
      toast('Shared with the group ♡');
      onClose();
    } catch (e: any) { toast(e?.message ?? 'Couldn’t share'); }
    setBusy(false);
  };
  return (
    <Sheet open onClose={onClose} title={p.slot ? SLOT_LABEL[p.slot] : 'Food photo'} footer={<div className="flex gap-2">
      <button className="btn-ghost flex-1" onClick={async () => { await deletePhoto(id); s.set((x) => { x.foodPhotos = x.foodPhotos.filter((y) => y.id !== id); }); toast('Photo deleted from this phone'); onClose(); }}><Trash2 size={16} />Delete</button>
      <button className="btn-primary flex-[1.4]" disabled={busy} onClick={share}><Share2 size={16} />{p.sharedAt ? 'Share again' : 'Share to group'}</button></div>}>
      <LocalImg id={id} className="w-full rounded-2xl mb-3" />
      <Field label="Caption"><input className="field" value={p.caption} onChange={(e) => s.set((x) => { const f = x.foodPhotos.find((y) => y.id === id); if (f) f.caption = e.target.value; })} /></Field>
    </Sheet>
  );
}
