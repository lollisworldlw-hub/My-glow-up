import { Home, UtensilsCrossed, Dumbbell, LineChart, ShoppingBasket, Settings, MessageCircleHeart, Brain, Sparkles, LayoutGrid } from 'lucide-react';
import type { Tab } from './ui';

export const NAV: { id: Tab; label: string; icon: typeof Home; blurb: string }[] = [
  { id: 'home', label: 'Home', icon: Home, blurb: 'Today at a glance' },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed, blurb: 'Plan, recipes & desserts' },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell, blurb: 'Walks, strength & steps' },
  { id: 'progress', label: 'Progress', icon: LineChart, blurb: 'Weight, body, habits, cycle' },
  { id: 'social', label: 'Social', icon: MessageCircleHeart, blurb: 'Chat & cheer with friends' },
  { id: 'mind', label: 'Mind', icon: Brain, blurb: 'Mood, goals & calm tools' },
  { id: 'clean', label: 'Clean', icon: Sparkles, blurb: 'Tasks & weekly schedule' },
  { id: 'groceries', label: 'Groceries', icon: ShoppingBasket, blurb: 'Shopping list & meal prep' },
  { id: 'settings', label: 'Settings', icon: Settings, blurb: 'Goals, diet & customizing' }
];
export const PICKABLE = () => NAV.filter((n) => n.id !== 'home');
export const MORE = { id: 'more' as Tab, label: 'More', icon: LayoutGrid };

/** The bottom bar is fixed: Progress and Settings open from the profile circle, groceries live in Meals. */
export const BOTTOM: Tab[] = ['home', 'meals', 'workouts', 'mind', 'clean', 'social'];
export const bottomTabs = (_navTabs?: string[]): Tab[] => BOTTOM;
