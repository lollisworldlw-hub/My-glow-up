import { useEffect, useState } from 'react';
import { Home as HomeIcon, UtensilsCrossed, Dumbbell, LineChart, ShoppingBasket, Settings as SettingsIcon } from 'lucide-react';
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
import { startSync } from './lib/sync';

const NAV: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'progress', label: 'Progress', icon: LineChart },
  { id: 'groceries', label: 'Groceries', icon: ShoppingBasket },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
];

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
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#1D171C' : '#FFF9F7');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
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
      if (mn?.on && wd >= 1 && wd <= 5 && hm >= mn.start && hm <= mn.end && now.getMinutes() < 10) {
        const key = `move-${now.getHours()}`;
        if (!(s.reminderSeen[today] ?? []).includes(key)) {
          s.set((st) => { st.reminderSeen = { [today]: [...(st.reminderSeen[today] ?? []), key] }; });
          toast('Stand up & stretch for 2 minutes ♡');
        }
      }
      const seen = useStore.getState().reminderSeen[today] ?? [];
      const due = s.settings.reminders.filter((r) => r.on && r.time <= hm && !seen.includes(r.id));
      if (!due.length) return;
      // only remind for things within the last 3 hours so old ones don't pile up
      const fresh = due.filter((r) => { const [h, m] = r.time.split(':').map(Number); return now.getHours() * 60 + now.getMinutes() - (h * 60 + m) < 180; });
      s.set((st) => {
        st.reminderSeen = { [today]: [...seen, ...due.map((r) => r.id)] };
      });
      for (const r of fresh) {
        toast(`Reminder: ${r.label} ♡`);
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
  useTheme();
  useReminders();

  useEffect(() => {
    if (!hydrated) return;
    navigator.storage?.persist?.().catch(() => {});
    startSync();
  }, [hydrated]);

  if (!hydrated) {
    return <div className="h-full grid place-items-center"><div className="h-serif text-[28px] text-deep animate-pulse">My Glow-Up ♡</div></div>;
  }

  return (
    <div className="min-h-full">
      <main className="mx-auto max-w-[640px] px-4 safe-top pb-nav">
        <div key={tab} className="fade">
          {tab === 'home' && <Home />}
          {tab === 'meals' && <Meals />}
          {tab === 'workouts' && <Workouts />}
          {tab === 'progress' && <Progress />}
          {tab === 'groceries' && <Groceries />}
          {tab === 'settings' && <Settings />}
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-line safe-bottom" aria-label="Main">
        <div className="mx-auto max-w-[640px] grid grid-cols-6">
          {NAV.map((n) => {
            const on = tab === n.id;
            const Icon = n.icon;
            return (
              <button key={n.id} onClick={() => go(n.id)} aria-current={on ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 min-h-[62px] transition ${on ? 'text-deep' : 'text-muted'}`}>
                <span className={`grid place-items-center w-11 h-7 rounded-full transition ${on ? 'bg-petal' : ''}`}><Icon size={21} strokeWidth={on ? 2.2 : 1.7} /></span>
                <span className={`text-[11px] leading-none ${on ? 'font-semibold' : ''}`}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {hasSession && <WorkoutPlayer />}
      <Toaster />
      <Celebration />
    </div>
  );
}
