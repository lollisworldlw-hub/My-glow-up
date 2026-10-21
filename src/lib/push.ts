import { supabase, useSync } from './sync';
import { useStore } from './store';

export const VAPID_PUBLIC = 'BEZUN0ZcznuLgdssaQTpKGzeIH1UGaGQ5YzbpT7_CWSZRgSUHHXeImH2RUPrqoXy8geG8Kf8UEH9SBaSDuuIKdo';

const b64ToBytes = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const isStandaloneApp = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Save which reminders this person wants (the server sends them at the right local time). */
export async function syncPrefs() {
  const { userId, member } = useSync.getState();
  if (!userId || !member) return;
  const st = useStore.getState().settings;
  await supabase.from('glowup_notify_prefs').upsert({
    user_id: userId,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
    reminders: st.reminders,
    move_nudge: st.moveNudge,
    messages: st.notifyMessages !== false,
    reactions: st.notifyReactions !== false,
    updated_at: new Date().toISOString()
  });
}

export async function enablePush(): Promise<void> {
  if (!useSync.getState().member) throw new Error('Sign in to your account first (Social tab)');
  if (!pushSupported()) throw new Error(isIOS() ? 'Open My Glow-Up from your Home Screen icon to turn on notifications' : 'This browser doesn’t support notifications');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications were not allowed. You can allow them in your phone’s Settings → Notifications → My Glow-Up');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC) });
  const j = sub.toJSON() as any;
  const { error } = await supabase.from('glowup_push_subs').upsert({ endpoint: j.endpoint, user_id: useSync.getState().userId, p256dh: j.keys.p256dh, auth: j.keys.auth });
  if (error) throw error;
  useStore.getState().set((x) => { x.settings.pushOn = true; });
  await syncPrefs();
}

export async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) { await supabase.from('glowup_push_subs').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); }
  } catch { /* */ }
  useStore.getState().set((x) => { x.settings.pushOn = false; });
}

export async function sendTest() {
  const { data } = await supabase.auth.getSession();
  const r = await fetch('https://faqgsczbjrdkriaqytsc.supabase.co/functions/v1/glowup-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: JSON.stringify({ mode: 'test' })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? 'Couldn’t send');
  return j.sent as number;
}

/** Keep the server copy of reminder settings up to date while signed in. */
let timer: ReturnType<typeof setTimeout> | null = null;
export function startPushSync() {
  let prev = JSON.stringify(pick());
  useStore.subscribe(() => {
    const now = JSON.stringify(pick());
    if (now === prev) return;
    prev = now;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { syncPrefs().catch(() => {}); }, 1500);
  });
  useSync.subscribe((s, p) => { if (s.member && !p.member) syncPrefs().catch(() => {}); });
}
function pick() {
  const st = useStore.getState().settings;
  return [st.reminders, st.moveNudge, st.notifyMessages, st.notifyReactions];
}
