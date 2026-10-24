import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NAV, bottomTabs } from './lib/nav';
import { useStore } from './lib/store';
import { useUI, type Tab } from './lib/ui';
import { todayKey } from './lib/date';
import Home from './screens/Home';
import Meals from './screens/Meals';
import Workouts from './screens/Workouts';
import Progress from './screens/Progress';
import { Celebration, Toaster, toast } from './components/ui';
import { WorkoutPlayer } from './components/WorkoutPlayer';
import { Logo } from './components/Art';
import { startSync, useSync } from './lib/sync';
import { InstallBanner } from './components/InstallBanner';
import { RecoverySheet } from './components/CloudCard';
import { ErrorBoundary } from './components/ErrorBoundary';
import Social from './screens/Social';
import Mind from './screens/Mind';
import Clean from './screens/Clean';
import Onboarding from './screens/Onboarding';
import { useSocial, unreadCount, loadSocial, startLive } from './lib/social';



function useHydrated() {
  const [h, setH] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const un = useStore.persist.onFinishHydration(() => setH(true));
    setH(useStore.persist.hasHydrated());
    return un;
  }, []);
  return h;
}

function useTheme() {
  const theme = useStore((s) => s.settings.theme);
  const palette = useStore((s) => s.settings.palette ?? 'euca');
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.dataset.palette = palette;
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--band-2').trim();
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', bg || '#23312B');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme, palette]);
}

function useReminders() {
  useEffect(() => {
    const check = () => {
      const s = useStore.getState();
      const today = todayKey();
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const mn = s.settings.moveNudge;
      const wd = now.getDay();
      if (!(s.settings.pushOn && typeof Notification !== 'undefined' && Notification.permission === 'granted') && mn?.on && wd >= 1 && wd <= 5 && hm >= mn.start && hm <= mn.end && now.getMinutes() < 10) {
        const key = `move-${now.getHours()}`;
        if (!(s.reminderSeen[today] ?? []).includes(key)) {
          s.set((st) => { st.reminderSeen = { [today]: [...(st.reminderSeen[today] ?? []), key] }; });
          toast('Stand up & stretch for 2 minutes');
        }
      }
      const seen = useStore.getState().reminderSeen[today] ?? [];
      const pushing = !!s.settings.pushOn && typeof Notification !== 'undefined' && Notification.permission === 'granted';
      const due = pushing ? [] : s.settings.reminders.filter((r) => r.on && r.time <= hm && !seen.includes(r.id) && (!r.days?.length || r.days.includes(now.getDay())));
      if (!due.length) return;
      // only remind for things within the last 3 hours so old ones don't pile up
      const fresh = due.filter((r) => { const [h, m] = r.time.split(':').map(Number); return now.getHours() * 60 + now.getMinutes() - (h * 60 + m) < 180; });
      s.set((st) => {
        st.reminderSeen = { [today]: [...seen, ...due.map((r) => r.id)] };
      });
      for (const r of fresh) {
        toast(`Reminder: ${r.label}`);
        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted')
            navigator.serviceWorker?.ready.then((reg) => reg.showNotification('My Glow-Up', { body: r.label, icon: '/icons/icon-192.png' }));
        } catch { /* ignore */ }
      }
    };
    const iv = setInterval(check, 30000);
    const t = setTimeout(check, 3000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(iv); clearTimeout(t); document.removeEventListener('visibilitychange', check); };
  }, []);
}

export default function App() {
  const hydrated = useHydrated();
  const tab = useUI((u) => u.tab);
  const go = useUI((u) => u.go);
  const hasSession = useStore((s) => !!s.session);
  const name = useStore((s) => s.settings.name);
  const onboarded = useStore((s) => s.settings.onboarded);
  const bottom = bottomTabs(useStore((s) => s.settings.navTabs));
  const { userId, member } = useSync();
  useSocial((s) => s.messages.length + Object.keys(s.lastRead).length); // re-render on new messages
  const unread = member ? unreadCount(userId) : 0;
  useEffect(() => { if (member) { loadSocial(); startLive(); } }, [member]);
  useEffect(() => {
    const open = (url: string) => { try { const t = new URL(url, location.origin).searchParams.get('tab'); if (t) go(t as any); } catch { /* */ } };
    open(location.href);
    if (location.search.includes('tab=')) history.replaceState(null, '', '/');
    const h = (e: MessageEvent) => { if (e.data?.type === 'open') open(e.data.url); };
    navigator.serviceWorker?.addEventListener('message', h);
    return () => navigator.serviceWorker?.removeEventListener('message', h);
  }, []);
  useEffect(() => { try { if (sessionStorage.getItem('glowup-updated')) { sessionStorage.removeItem('glowup-updated'); setTimeout(() => toast('Updated to the newest version'), 800); } } catch { /* */ } }, []);
  useTheme();
  useReminders();

  // The dark band runs from the top of the page down to the first card; everything above that card is styled for the dark.
  const wrapRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [bandH, setBandH] = useState(0);
  useLayoutEffect(() => {
    const main = mainRef.current, wrap = wrapRef.current;
    if (!main || !wrap) return;
    let raf = 0;
    const calc = () => {
      main.querySelectorAll('.auto-dark').forEach((e) => e.classList.remove('on-dark', 'auto-dark'));
      if (tab === 'home') { setBandH(0); return; }
      let card = main.querySelector('.card') as HTMLElement | null;
      const top0 = wrap.getBoundingClientRect().top;
      // pages with no box near the top (like the chat): end the band under the tabs instead
      const tabs = main.querySelector('[role=tablist]') as HTMLElement | null;
      if (tabs && (tabs.closest('.sticky') || !card || card.getBoundingClientRect().top - top0 > 420)) {
        let el: HTMLElement | null = tabs;
        while (el && el !== main) {
          if (!el.classList.contains('on-dark')) el.classList.add('on-dark', 'auto-dark');
          let sib = el.previousElementSibling as HTMLElement | null;
          while (sib) { if (!sib.classList.contains('on-dark')) sib.classList.add('on-dark', 'auto-dark'); sib = sib.previousElementSibling as HTMLElement | null; }
          el = el.parentElement;
          if (el && el.contains(tabs) && el !== main && el.querySelector('.card, textarea')) break;
        }
        // pinned (sticky) title + tabs: size the band from layout, not the current scroll position
        const sticky = tabs.closest('.sticky') as HTMLElement | null;
        if (sticky) {
          setBandH(Math.round(parseFloat(getComputedStyle(main).paddingTop) + sticky.offsetHeight + 14));
          return;
        }
        setBandH(Math.round(tabs.getBoundingClientRect().bottom - top0 + 18));
        return;
      }
      if (!card) { setBandH(0); return; }
      let el: HTMLElement | null = card;
      while (el && el !== main) {
        let sib = el.previousElementSibling as HTMLElement | null;
        while (sib) { if (!sib.classList.contains('on-dark')) sib.classList.add('on-dark', 'auto-dark'); sib = sib.previousElementSibling as HTMLElement | null; }
        el = el.parentElement;
      }
      setBandH(Math.round(card.getBoundingClientRect().top - wrap.getBoundingClientRect().top + 30));
    };
    calc();
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(calc); });
    mo.observe(main, { childList: true, subtree: true });
    const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(calc); };
    const ro = new ResizeObserver(later);
    ro.observe(main);
    document.fonts?.ready.then(later);
    const timers = [120, 400, 1000].map((ms) => setTimeout(later, ms));
    window.addEventListener('resize', later);
    return () => { mo.disconnect(); ro.disconnect(); timers.forEach(clearTimeout); cancelAnimationFrame(raf); window.removeEventListener('resize', later); };
  }, [tab, hydrated, onboarded]);

  useEffect(() => {
    if (!hydrated) return;
    navigator.storage?.persist?.().catch(() => {});
    startSync();
  }, [hydrated]);

  if (!hydrated) {
    return <div className="h-full grid place-items-center"><div className="h-serif text-[18px] text-deep animate-pulse">My Glow-Up</div></div>;
  }

  if (!onboarded) return <><Onboarding /><RecoverySheet /><Toaster /></>;

  return (
    <div className="min-h-full app-root">
      <div className="status-cap" aria-hidden />
      <InstallBanner />
      <div className="relative" ref={wrapRef}>
      {tab !== 'home' && <div className={`band inset-x-0 top-0 ${tab === 'social' ? 'fixed z-20' : 'absolute'}`} style={{ height: bandH || 'calc(56px + env(safe-area-inset-top))' }} aria-hidden />}
      <header className={`${tab === 'social' ? 'fixed' : 'absolute'} inset-x-0 top-0 z-30 app-header top-safe mt-3 on-dark`}>
        <div className="mx-auto max-w-[640px] px-5 h-14 flex items-center justify-between">
          <button className="flex items-center gap-2 min-h-[44px]" aria-label="Home" onClick={() => go('home')}>
            <Logo size={28} />
            <span className="h-serif text-[19px] leading-none text-ink">Glow-Up</span>
          </button>
          <button aria-label="Your progress and settings" onClick={() => go('settings')} className="w-9 h-9 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-2))' }}>
            <span className="w-full h-full rounded-full grid place-items-center text-[13px] font-semibold text-gold" style={{ background: 'var(--band-2)' }}>{(name || 'G').slice(0, 1).toUpperCase()}</span>
          </button>
        </div>
      </header>
      <main ref={mainRef} className={`relative mx-auto max-w-[640px] px-3 pb-nav ${tab === 'home' ? '' : 'pt-[calc(72px+env(safe-area-inset-top))]'}`}>
        <ErrorBoundary resetKey={tab}>
        <div key={tab} className="fade">
          {tab === 'home' && <Home />}
          {tab === 'meals' && <Meals />}
          {tab === 'workouts' && <Workouts />}
          {tab === 'settings' && <Progress />}
          {tab === 'social' && <Social />}
          {tab === 'mind' && <Mind />}
          {tab === 'clean' && <Clean />}
        </div>
        </ErrorBoundary>
      </main>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg bar-bg border-t border-line safe-bottom" aria-label="Main">
        <div className="mx-auto max-w-[640px] flex nav-pill-wrap">
          {bottom.map((id) => NAV.find((n) => n.id === id)!).map((n) => {
            const on = tab === n.id;
            const Icon = n.icon;
            return (
              <button key={n.id} onClick={() => go(n.id)} aria-current={on ? 'page' : undefined}
                className={`relative flex items-center justify-center gap-1.5 min-h-[46px] transition-all nav-btn ${on ? 'flex-[2.2] nav-on' : 'flex-1 text-muted'}`}>
                {n.id === 'social' && unread > 0 && <span className="absolute top-1.5 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-deep text-white text-[11px] grid place-items-center" aria-label={`${unread} unread`}>{unread > 9 ? '9+' : unread}</span>}
                <Icon size={19} strokeWidth={on ? 1.8 : 1.5} />
                {on ? <span className="text-[13px] font-semibold leading-none">{n.label}</span> : <span className="sr-only">{n.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {hasSession && <WorkoutPlayer />}
      <RecoverySheet />
      <Toaster />
      <Celebration />
    </div>
  );
}
