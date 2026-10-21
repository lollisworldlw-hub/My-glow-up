import { supabase, useSync } from './sync';
import { useStore } from './store';
import { addDays, todayKey } from './date';

export const STEPS_URL = 'https://faqgsczbjrdkriaqytsc.supabase.co/functions/v1/glowup-steps';

/** Make a new private key for the iPhone Shortcut (replaces any older key). */
export async function newStepsKey(): Promise<string> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  const { data, error } = await supabase.rpc('glowup_new_steps_token', { p_tz: tz });
  if (error) throw error;
  return data as string;
}
export async function removeStepsKey() {
  await supabase.rpc('glowup_remove_steps_token');
}
export async function stepsStatus(): Promise<{ connected: boolean; lastUsed: string | null }> {
  const uid = useSync.getState().userId;
  if (!uid) return { connected: false, lastUsed: null };
  const { data } = await supabase.from('glowup_steps_tokens').select('last_used').eq('user_id', uid).maybeSingle();
  return { connected: !!data, lastUsed: data?.last_used ?? null };
}

/** Copy step counts sent by the Shortcut into the app. */
export async function pullSteps() {
  const { userId, member } = useSync.getState();
  if (!userId || !member) return;
  const { data } = await supabase.from('glowup_steps').select('day, steps').eq('user_id', userId).gte('day', addDays(todayKey(), -60));
  if (!data?.length) return;
  const cur = useStore.getState().steps;
  const changed = data.filter((r: any) => cur[r.day] !== r.steps);
  if (!changed.length) return;
  useStore.getState().set((x) => { for (const r of changed as any[]) x.steps[r.day] = r.steps; });
}

export function startStepsPull() {
  const run = () => { pullSteps().catch(() => {}); };
  useSync.subscribe((s, p) => { if (s.member && !p.member) run(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') run(); });
  setInterval(() => { if (document.visibilityState === 'visible') run(); }, 5 * 60_000);
  run();
}
