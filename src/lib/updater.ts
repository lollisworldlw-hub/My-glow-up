// Keeps open apps on the newest version: checks /version.json on launch, every minute,
// and whenever the app comes back to the screen. When a new build is live it updates the
// service worker and reloads (waiting until you're not typing).
declare const __BUILD_ID__: string;
export const BUILD = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';

let reg: ServiceWorkerRegistration | undefined;
export const setRegistration = (r?: ServiceWorkerRegistration) => { reg = r; };

const typing = () => {
  const a = document.activeElement as HTMLElement | null;
  return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
};

async function latestId(): Promise<string | null> {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()).id ?? null;
  } catch { return null; }
}

let updating = false;
async function applyUpdate() {
  if (updating) return;
  updating = true;
  try { sessionStorage.setItem('glowup-updated', '1'); } catch { /* */ }
  try {
    await reg?.update();
    // give the new service worker a moment to install and take over
    await new Promise<void>((res) => {
      const t = setTimeout(res, 6000);
      navigator.serviceWorker?.addEventListener('controllerchange', () => { clearTimeout(t); res(); }, { once: true });
      if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    });
  } catch { /* fall through */ }
  // if we already reloaded once for this version and are still old, clear the cache completely
  const tries = Number(sessionStorage.getItem('glowup-update-tries') ?? 0);
  if (tries >= 3) { updating = false; return; } // never loop; try again next session
  if (tries >= 1) {
    try { for (const k of await caches.keys()) await caches.delete(k); await reg?.unregister(); } catch { /* */ }
  }
  try { sessionStorage.setItem('glowup-update-tries', String(tries + 1)); } catch { /* */ }
  window.location.reload();
}

export async function checkForUpdate() {
  if (BUILD === 'dev' || !navigator.onLine) return;
  const id = await latestId();
  if (!id || id === BUILD) { try { sessionStorage.removeItem('glowup-update-tries'); } catch { /* */ } return; }
  if (typing()) { document.addEventListener('focusout', () => setTimeout(checkForUpdate, 500), { once: true }); return; }
  applyUpdate();
}

export function startUpdater() {
  checkForUpdate();
  setInterval(checkForUpdate, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
  window.addEventListener('focus', checkForUpdate);
  window.addEventListener('online', checkForUpdate);
}
