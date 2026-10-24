import { createStore, get, set, del, clear, keys } from 'idb-keyval';
import type { State } from './store';

const photoStore = createStore('glowup-photos', 'blobs');

// Photos live on the phone for speed and in the person's private cloud folder so a new phone gets them back.
const BUCKET = 'glowup-private';
async function cloud() {
  const { supabase } = await import('./sync');
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  return uid ? { supabase, uid } : null;
}
async function uploadPhoto(id: string, blob: Blob) {
  try {
    const c = await cloud(); if (!c) return;
    await c.supabase.storage.from(BUCKET).upload(`${c.uid}/${id}`, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
  } catch { /* retried by syncPhotos */ }
}
export const savePhoto = async (id: string, blob: Blob) => { await set(id, blob, photoStore); uploadPhoto(id, blob); };
export async function loadPhoto(id: string): Promise<Blob | undefined> {
  const local = await get<Blob>(id, photoStore);
  if (local) return local;
  try {
    const c = await cloud(); if (!c) return undefined;
    const { data } = await c.supabase.storage.from(BUCKET).download(`${c.uid}/${id}`);
    if (data) { await set(id, data, photoStore); return data; }
  } catch { /* offline */ }
  return undefined;
}
export const deletePhoto = async (id: string) => {
  await del(id, photoStore);
  try { const c = await cloud(); if (c) await c.supabase.storage.from(BUCKET).remove([`${c.uid}/${id}`]); } catch { /* */ }
};
/** Upload any photos this phone has that the account doesn't yet. */
let photoSyncing = false;
export async function syncPhotos(ids: string[]) {
  if (photoSyncing || !ids.length) return;
  photoSyncing = true;
  try {
    const c = await cloud(); if (!c) return;
    const { data: remote, error } = await c.supabase.storage.from(BUCKET).list(c.uid, { limit: 1000 });
    if (error) return;
    const have = new Set((remote ?? []).map((f) => f.name));
    for (const id of ids) {
      if (have.has(id)) continue;
      const b = await get<Blob>(id, photoStore);
      if (b) await c.supabase.storage.from(BUCKET).upload(`${c.uid}/${id}`, b, { upsert: true, contentType: b.type || 'image/jpeg' });
    }
  } catch { /* try again next sync */ } finally { photoSyncing = false; }
}
export const clearPhotos = () => clear(photoStore);

/** Resize to keep storage small while staying sharp on a phone. Stays on-device. */
export async function resizeImage(file: File, max = 1400): Promise<{ blob: Blob; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.85));
    return { blob, w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const blobToDataUrl = (b: Blob) => new Promise<string>((res) => {
  const r = new FileReader();
  r.onload = () => res(r.result as string);
  r.readAsDataURL(b);
});
const dataUrlToBlob = async (d: string) => (await fetch(d)).blob();

export async function exportData(state: State, includePhotos: boolean) {
  const photos: Record<string, string> = {};
  if (includePhotos) {
    for (const p of [...state.photos, ...(state.foodPhotos ?? [])]) {
      const b = await loadPhoto(p.id);
      if (b) photos[p.id] = await blobToDataUrl(b);
    }
  }
  const { session: _s, ...rest } = state;
  return JSON.stringify({ app: 'my-glow-up', version: 1, exportedAt: new Date().toISOString(), state: rest, photos });
}

export async function parseBackup(text: string): Promise<{ state: State; photos: Record<string, string> }> {
  const data = JSON.parse(text);
  if (data?.app !== 'my-glow-up' || !data.state) throw new Error('This file isn’t a My Glow-Up backup.');
  return { state: data.state as State, photos: data.photos ?? {} };
}

export async function restorePhotos(photos: Record<string, string>) {
  for (const [id, d] of Object.entries(photos)) await savePhoto(id, await dataUrlToBlob(d));
}

export async function photoCount() {
  return (await keys(photoStore)).length;
}

export function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
