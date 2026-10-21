import { useEffect, useState } from 'react';
import { supabase, useSync } from './sync';
import { uid } from './date';

const BUCKET = 'glowup-media';

async function compress(blob: Blob, max = 1280): Promise<{ blob: Blob; w: number; h: number }> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const out = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.84));
    return { blob: out, w, h };
  } finally { URL.revokeObjectURL(url); }
}

async function gifSize(blob: Blob): Promise<{ w: number; h: number }> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    return { w: img.naturalWidth, h: img.naturalHeight };
  } finally { URL.revokeObjectURL(url); }
}

/** Upload a photo or GIF to the group's private storage. GIFs keep their animation. */
export async function uploadMedia(file: Blob): Promise<{ path: string; w: number; h: number; gif: boolean }> {
  const me = useSync.getState().userId;
  if (!me) throw new Error('Please sign in');
  const gif = file.type === 'image/gif';
  if (gif && file.size > 9_500_000) throw new Error('That GIF is too big (max ~9 MB)');
  const { blob, w, h } = gif ? { blob: file, ...(await gifSize(file)) } : await compress(file);
  const path = `${me}/${uid()}.${gif ? 'gif' : 'jpg'}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: gif ? 'image/gif' : 'image/jpeg', upsert: false });
  if (error) throw error;
  return { path, w, h, gif };
}

const cache = new Map<string, { url: string; exp: number }>();
export function useMediaUrl(path?: string | null) {
  const [url, setUrl] = useState<string | undefined>(() => (path ? cache.get(path)?.url : undefined));
  useEffect(() => {
    if (!path) return;
    const c = cache.get(path);
    if (c && c.exp > Date.now()) { setUrl(c.url); return; }
    let alive = true;
    supabase.storage.from(BUCKET).createSignedUrl(path, 3600).then(({ data }) => {
      if (data?.signedUrl && alive) { cache.set(path, { url: data.signedUrl, exp: Date.now() + 3500_000 }); setUrl(data.signedUrl); }
    });
    return () => { alive = false; };
  }, [path]);
  return url;
}

/** Plain GIF links (e.g. from GIPHY or Tenor) show as images in chat. */
export function gifUrl(text: string): string | null {
  const t = text.trim();
  if (!/^https:\/\/\S+$/.test(t)) return null;
  if (/\.(gif|webp)(\?\S*)?$/i.test(t)) return t;
  if (/^https:\/\/(media\d?\.giphy\.com|i\.giphy\.com|media\.tenor\.com)\//i.test(t)) return t;
  return null;
}
