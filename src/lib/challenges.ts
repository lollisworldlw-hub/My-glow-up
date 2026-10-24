import { create } from 'zustand';
import { supabase, useSync } from './sync';
import { useStore, type State } from './store';
import { consumed } from './derived';
import { addDays, todayKey } from './date';
import { send } from './social';

export type Metric = 'steps' | 'protein' | 'water' | 'workout' | 'logging' | 'checkin';
export interface Challenge { id: number; title: string; metric: Metric; goal: number | null; start_date: string; end_date: string; created_by: string }
interface CState { list: Challenge[]; joined: { challenge_id: number; user_id: string }[]; days: { challenge_id: number; user_id: string; day: string }[]; loaded: boolean; error: string | null }
export const useChallenges = create<CState>(() => ({ list: [], joined: [], days: [], loaded: false, error: null }));

export const TEMPLATES: { metric: Metric; title: string; goal: number | null; days: number; blurb: string }[] = [
  { metric: 'steps', title: '10k steps a day', goal: 10000, days: 14, blurb: 'Counts on days you reach 10,000 steps.' },
  { metric: 'protein', title: 'Protein streak', goal: null, days: 14, blurb: 'Counts when you hit your own protein target. Nobody sees your numbers.' },
  { metric: 'water', title: 'Water every day', goal: null, days: 7, blurb: 'Counts when you reach your water goal.' },
  { metric: 'workout', title: 'Move every day', goal: null, days: 14, blurb: 'Counts when you finish a workout or walk.' },
  { metric: 'logging', title: 'Log every day', goal: null, days: 7, blurb: 'Counts on days you log your food.' },
  { metric: 'checkin', title: '', goal: null, days: 14, blurb: 'Your own idea, like “No sugar” or “In bed by 10”. Tap to check in each day.' }
];

export async function loadChallenges() {
  try {
    const since = addDays(todayKey(), -30);
    const c = await supabase.from('glowup_challenges').select('*').gte('end_date', since).order('start_date', { ascending: false });
    if (c.error) throw c.error;
    const ids = (c.data ?? []).map((x) => x.id);
    const [m, d] = ids.length
      ? await Promise.all([supabase.from('glowup_challenge_members').select('challenge_id,user_id').in('challenge_id', ids), supabase.from('glowup_challenge_days').select('challenge_id,user_id,day').in('challenge_id', ids)])
      : [{ data: [], error: null }, { data: [], error: null }];
    useChallenges.setState({ list: c.data as Challenge[], joined: (m.data ?? []) as any, days: (d.data ?? []) as any, loaded: true, error: null });
  } catch (e: any) {
    const missing = /relation|does not exist|schema cache/i.test(e?.message ?? '');
    useChallenges.setState({ loaded: true, error: missing ? 'setup' : e?.message ?? 'Couldn’t load challenges' });
  }
}

/** Did I hit this challenge on this day, from my own data? (only the yes/no is shared) */
export function hitOn(c: Challenge, s: State, d: string): boolean {
  switch (c.metric) {
    case 'steps': return (s.steps[d] ?? 0) >= (c.goal ?? 10000);
    case 'protein': return consumed(s, d).protein >= s.settings.proteinMin;
    case 'water': return (s.water[d] ?? 0) >= s.settings.waterTarget;
    case 'workout': return s.workouts.some((w) => w.date === d && w.completed);
    case 'logging': return s.logs.some((l) => l.date === d);
    default: return false;
  }
}

/** Post my automatic check-ins for every challenge I’m in. */
export async function postMyDays() {
  const uid = useSync.getState().userId;
  if (!uid) return;
  const { list, joined, days } = useChallenges.getState();
  const s = useStore.getState();
  const today = todayKey();
  const rows: { challenge_id: number; user_id: string; day: string }[] = [];
  for (const c of list) {
    if (c.metric === 'checkin' || !joined.some((j) => j.challenge_id === c.id && j.user_id === uid)) continue;
    for (let d = c.start_date; d <= c.end_date && d <= today; d = addDays(d, 1)) {
      if (hitOn(c, s, d) && !days.some((x) => x.challenge_id === c.id && x.user_id === uid && x.day === d)) rows.push({ challenge_id: c.id, user_id: uid, day: d });
    }
  }
  if (!rows.length) return;
  const { error } = await supabase.from('glowup_challenge_days').upsert(rows, { onConflict: 'challenge_id,user_id,day', ignoreDuplicates: true });
  if (!error) useChallenges.setState({ days: [...useChallenges.getState().days, ...rows] });
}

export async function createChallenge(t: { title: string; metric: Metric; goal: number | null; start: string; days: number }) {
  const { data, error } = await supabase.from('glowup_challenges').insert({ title: t.title.trim(), metric: t.metric, goal: t.goal, start_date: t.start, end_date: addDays(t.start, t.days - 1) }).select().single();
  if (error) throw error;
  await joinChallenge(data.id);
  send(`Started a challenge: ${t.title.trim()}. Join it from Challenges.`, null).catch(() => {});
  await loadChallenges();
  postMyDays();
}
export async function joinChallenge(id: number) {
  const { error } = await supabase.from('glowup_challenge_members').insert({ challenge_id: id });
  if (error && !/duplicate/i.test(error.message)) throw error;
  await loadChallenges();
  postMyDays();
}
export async function leaveChallenge(id: number) {
  const { error } = await supabase.from('glowup_challenge_members').delete().eq('challenge_id', id).eq('user_id', useSync.getState().userId!);
  if (error) throw error;
  await loadChallenges();
}
export async function endChallenge(id: number) {
  const { error } = await supabase.from('glowup_challenges').delete().eq('id', id);
  if (error) throw error;
  await loadChallenges();
}
export async function toggleCheckin(id: number, day: string, on: boolean) {
  const uid = useSync.getState().userId!;
  const { error } = on
    ? await supabase.from('glowup_challenge_days').insert({ challenge_id: id, user_id: uid, day })
    : await supabase.from('glowup_challenge_days').delete().eq('challenge_id', id).eq('user_id', uid).eq('day', day);
  if (error) throw error;
  await loadChallenges();
}
