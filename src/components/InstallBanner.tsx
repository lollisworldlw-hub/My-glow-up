import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const ua = () => navigator.userAgent || '';
const isIOS = () => /iPhone|iPad|iPod/.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInAppBrowser = () => /FBAN|FBAV|Instagram|Line\/|Snapchat|GSA\/|CriOS|FxiOS|EdgiOS/.test(ua());
const KEY = 'glowup-install-dismissed';

let deferred: any = null;
window.addEventListener('beforeinstallprompt', (e: any) => { e.preventDefault(); deferred = e; });

/** Shown at the top when the app is opened in a browser instead of from the Home Screen. */
export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  useEffect(() => {
    if (isStandalone()) return;
    let until = 0;
    try { until = Number(localStorage.getItem(KEY) ?? 0); } catch { /* */ }
    if (Date.now() > until) setShow(true);
    const h = (e: any) => { e.preventDefault(); deferred = e; setCanPrompt(true); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  if (!show) return null;
  const dismiss = () => { setShow(false); try { localStorage.setItem(KEY, String(Date.now() + 3 * 86400000)); } catch { /* */ } };
  const ios = isIOS();
  const otherIOSBrowser = ios && isInAppBrowser();

  return (
    <div className="bg-deep text-white safe-top" role="region" aria-label="Install the app">
      <div className="mx-auto max-w-[640px] px-3 py-2 flex items-start gap-2">
        <img src="/icons/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 text-[13px] leading-snug">
          <div className="font-semibold text-[14px]">Get the My Glow-Up app</div>
          {canPrompt ? (
            <div>Install it for full-screen use, offline access, and staying signed in.</div>
          ) : otherIOSBrowser ? (
            <div>Open this page in <b>Safari</b>, then tap Share <Share size={13} className="inline -mt-0.5" /> → <b>Add to Home Screen</b>.</div>
          ) : ios ? (
            <div>Tap Share <Share size={13} className="inline -mt-0.5" /> below, then <b>Add to Home Screen</b>. Install before signing in so you only sign in once.</div>
          ) : (
            <div>Use your browser menu → <b>Install app</b> or <b>Add to Home screen</b>.</div>
          )}
          {canPrompt && (
            <button className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white text-deep font-semibold px-4 py-2" onClick={async () => { deferred?.prompt(); await deferred?.userChoice; deferred = null; setCanPrompt(false); setShow(false); }}>
              <Download size={15} />Install
            </button>
          )}
        </div>
        <button aria-label="Dismiss" className="w-9 h-9 grid place-items-center rounded-full bg-white/15 shrink-0" onClick={dismiss}><X size={16} /></button>
      </div>
    </div>
  );
}
export { isStandalone };
