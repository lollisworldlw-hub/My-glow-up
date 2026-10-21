import { Home, UtensilsCrossed, Dumbbell, LineChart, ShoppingBasket, Settings, MessageCircleHeart, Brain, Sparkles, LayoutGrid } from 'lucide-react';
import type { Tab } from './ui';

export const NAV: { id: Tab; label: string; icon: typeof Home; blurb: string }[] = [
  { id: 'home', label: 'Home', icon: Home, blurb: 'Today at a glance' },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed, blurb: 'Plan, recipes & desserts' },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell, blurb: 'Walks, strength & steps' },
  { id: 'progress', label: 'Progress', icon: LineChart, blurb: 'Weight, body, habits, cycle' },
  { id: 'social', label: 'Social', icon: MessageCircleHeart, blurb: 'Chat & cheer with friends' },
  { id: 'mind', label: 'Mind', icon: Brain, blurb: 'Mood, goals & calm tools' },
  { id: 'clean', label: 'Cleaning', icon: Sparkles, blurb: 'Tasks & weekly schedule' },
  { id: 'groceries', label: 'Groceries', icon: ShoppingBasket, blurb: 'Shopping list & meal prep' },
  { id: 'settings', label: 'Settings', icon: Settings, blurb: 'Goals, diet & customizing' }
];
export const MORE = { id: 'more' as Tab, label: 'More', icon: LayoutGrid };

export const bottomTabs = (navTabs: string[] | undefined): Tab[] => {
  const valid = (navTabs ?? []).filter((t) => NAV.some((n) => n.id === t)) as Tab[];
  return (valid.length ? valid : ['home', 'meals', 'workouts', 'progress', 'social'] as Tab[]).slice(0, 5);
};
