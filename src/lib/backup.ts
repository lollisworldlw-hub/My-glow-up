import { createStore, get, set, del, clear, keys } from 'idb-keyval';
import type { State } from './store';

const photoStore = createStore('glowup-photos', 'blobs');

export const savePhoto = (id: string, blob: Blob) => set(id, blob, photoStore);
export const loadPhoto = (id: string) => get<Blob>(id, photoStore);
export const deletePhoto = (id: string) => del(id, photoStore);
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
