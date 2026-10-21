import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Sheet } from './ui';

// Free GIPHY API key (designed to live in client apps; only allows GIF search).
export const GIPHY_KEY = '';

interface Gif { id: string; url: string; preview: string; w: number; h: number }

export function GifPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const base = 'https://api.giphy.com/v1/gifs/';
        const url = q.trim() ? `${base}search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q.trim())}&limit=30&rating=pg-13` : `${base}trending?api_key=${GIPHY_KEY}&limit=30&rating=pg-13`;
        const r = await fetch(url);
        const j = await r.json();
        setGifs((j.data ?? []).map((g: any) => ({ id: g.id, url: g.images.fixed_height.url, preview: g.images.fixed_height_small?.url ?? g.images.fixed_height.url, w: +g.images.fixed_height.width, h: +g.images.fixed_height.height })));
      } catch { setGifs([]); }
      setBusy(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <Sheet open onClose={onClose} title="Send a GIF">
      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input className="field pl-11" placeholder="Search GIPHY" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </div>
      {busy && !gifs.length && <p className="text-muted">Loading…</p>}
      <div className="columns-2 gap-2">
        {gifs.map((g) => (
          <button key={g.id} className="mb-2 w-full block" onClick={() => onPick(g.url)}>
            <img src={g.preview} alt="" loading="lazy" className="w-full rounded-xl bg-petal" style={{ aspectRatio: `${g.w} / ${g.h}` }} />
          </button>
        ))}
      </div>
      <p className="text-[12px] text-muted text-center mt-2">Powered by GIPHY</p>
    </Sheet>
  );
}
