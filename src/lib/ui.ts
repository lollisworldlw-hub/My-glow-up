import { create } from 'zustand';

export type Tab = 'home' | 'meals' | 'workouts' | 'progress' | 'groceries' | 'settings' | 'social' | 'mind' | 'clean' | 'more';
export const useUI = create<{
  tab: Tab;
  sub: Record<string, string>;
  go: (t: Tab, sub?: string) => void;
  setSub: (t: Tab, s: string) => void;
}>((set) => ({
  tab: 'home',
  sub: {},
  go: (tab, sub) => {
    // Groceries live inside Meals; Progress lives at the top of the profile page
    if (tab === 'groceries') { sub = 'groceries'; tab = 'meals'; }
    else if (tab === 'progress') { set((s) => ({ tab: 'settings', sub: sub ? { ...s.sub, progress: sub } : s.sub })); window.scrollTo({ top: 0 }); return; }
    else if (tab === 'more') tab = 'home';
    set((s) => ({ tab, sub: sub ? { ...s.sub, [tab]: sub } : s.sub }));
    window.scrollTo({ top: 0 });
  },
  setSub: (t, v) => set((s) => ({ sub: { ...s.sub, [t]: v } }))
}));
