import { useEffect, useState } from 'react';
import { NAV, MORE, bottomTabs } from './lib/nav';
import { useStore } from './lib/store';
import { useUI, type Tab } from './lib/ui';
import { todayKey } from './lib/date';
import Home from './screens/Home';
import Meals from './screens/Meals';
import Workouts from './screens/Workouts';
import Progress from './screens/Progress';
import Groceries from './screens/Groceries';
import Settings from './screens/Settings';
import { Celebration, Toaster, toast } from './components/ui';
import { WorkoutPlayer } from './components/WorkoutPlayer';
import { startSync, useSync } from './lib/sync';
import { InstallBanner } from './components/InstallBanner';
import { RecoverySheet } from './components/CloudCard';
import { ErrorBoundary } from './components/ErrorBoundary';
import Social from './screens/Social';
import Mind from './screens/Mind';
import Clean from './screens/Clean';
import More from './screens/More';
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
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', bg || '#F2F3F1');
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
    <div className="min-h-full">
      <InstallBanner />
      <header className="relative z-30 app-header top-safe">
        <div className="mx-auto max-w-[640px] px-5 h-14 flex items-center justify-between">
          <button className="flex items-center gap-2 min-h-[44px]" aria-label="Home" onClick={() => go('home')}>
            <img src="/icons/icon-192.png" alt="" className="w-7 h-7 rounded-full" />
            <span className={`h-serif text-[19px] leading-none ${tab === 'home' ? 'text-ink' : 'text-muted'}`}>Glow-Up</span>
          </button>
          <button aria-label="Settings" onClick={() => go('settings')} className="w-9 h-9 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-2))' }}>
            <span className="w-full h-full rounded-full grid place-items-center text-[13px] font-semibold text-gold" style={{ background: 'var(--grad-2)' }}>{(name || 'G').slice(0, 1).toUpperCase()}</span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[640px] px-3 pt-2.5 pb-nav">
        <ErrorBoundary resetKey={tab}>
        <div key={tab} className="fade">
          {tab === 'home' && <Home />}
          {tab === 'meals' && <Meals />}
          {tab === 'workouts' && <Workouts />}
          {tab === 'progress' && <Progress />}
          {tab === 'groceries' && <Groceries />}
          {tab === 'settings' && <Settings />}
          {tab === 'social' && <Social />}
          {tab === 'mind' && <Mind />}
          {tab === 'clean' && <Clean />}
          {tab === 'more' && <More />}
        </div>
        </ErrorBoundary>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg bar-bg border-t border-line safe-bottom" aria-label="Main">
        <div className="mx-auto max-w-[640px] flex nav-pill-wrap">
          {[...bottom.map((id) => NAV.find((n) => n.id === id)!), MORE].map((n) => {
            const on = n.id === 'more' ? tab !== 'home' && !bottom.includes(tab) : tab === n.id;
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
