// Cloud backup & sync: one private row per user in Supabase (row-level security:
// only the signed-in owner can read or write it). Photos never leave the device.
import { createClient, type Session as AuthSession } from '@supabase/supabase-js';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { create } from 'zustand';
import { useStore, stateOnly, type State } from './store';

// read the link details before the auth client consumes them
const LINK_INFO = typeof location !== 'undefined' ? location.hash + '&' + location.search : '';
const URL = 'https://faqgsczbjrdkriaqytsc.supabase.co';
const KEY = 'sb_publishable_sow0jzcrbqCOIxwZfGJGvg_i5kLpC_Z'; // publishable key — safe in the browser; RLS protects data
export const supabase = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'glowup-auth' } });

const META_KEY = 'glowup-sync-meta';
interface Meta { version: number; lastSynced: number | null; dirtyAt: number | null; userId: string | null }
let meta: Meta = { version: 0, lastSynced: null, dirtyAt: null, userId: null };
const saveMeta = () => idbSet(META_KEY, meta);

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error' | 'offline' | 'needs-invite';
export const useSync = create<{ status: SyncStatus; email: string | null; userId: string | null; member: boolean | null; lastSynced: number | null; error: string | null; recovery: boolean }>(() => ({
  status: 'off', email: null, userId: null, member: null, lastSynced: null, error: null, recovery: false
}));

// Password-reset links: catch them right away (even before sign-in/onboarding loads).
if (/type=recovery/.test(LINK_INFO)) useSync.setState({ recovery: true });
supabase.auth.onAuthStateChange((e) => { if (e === 'PASSWORD_RECOVERY') useSync.setState({ recovery: true }); });
const linkErr = /error_description=([^&]+)/.exec(LINK_INFO)?.[1];
export const authLinkError = linkErr ? decodeURIComponent(linkErr.replace(/\+/g, ' ')) : null;

const LOCAL_ONLY: (keyof State)[] = ['session', 'photos', 'reminderSeen', 'foodPhotos'];
function payload(): Partial<State> {
  const st: any = { ...stateOnly(useStore.getState()) };
  for (const k of LOCAL_ONLY) delete st[k];
  return st;
}

let applying = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let busy = false;

function applyRemote(data: Partial<State>) {
  applying = true;
  const cur = useStore.getState();
  cur.replaceAll({ ...stateOnly(cur), ...data, session: cur.session, photos: cur.photos, reminderSeen: cur.reminderSeen, foodPhotos: cur.foodPhotos } as State);
  setTimeout(() => { applying = false; }, 0);
}

async function userId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function syncNow(): Promise<void> {
  if (busy) return;
  const uid = await userId();
  if (!uid) { useSync.setState({ status: 'off' }); return; }
  if (!navigator.onLine) { useSync.setState({ status: 'offline' }); return; }
  busy = true;
  useSync.setState({ status: 'syncing', error: null });
  try {
    if (!(await ensureMember(uid))) { useSync.setState({ status: 'needs-invite' }); return; }
    if (meta.userId && meta.userId !== uid) meta = { version: 0, lastSynced: null, dirtyAt: Date.now(), userId: uid };
    meta.userId = uid;
    const { data: row, error } = await supabase.from('glowup_state').select('version, data, updated_at').eq('user_id', uid).maybeSingle();
    if (error) throw error;

    if (!row) {
      const { error: e } = await supabase.from('glowup_state').insert({ user_id: uid, data: payload(), version: 1 });
      if (e) throw e;
      meta.version = 1;
    } else if (row.version > meta.version) {
      // the cloud has changes from another device
      const remoteAt = new Date(row.updated_at).getTime();
      if (!meta.dirtyAt || remoteAt >= meta.dirtyAt || meta.version === 0) {
        applyRemote(row.data as Partial<State>);
        meta.version = row.version;
      } else {
        // this phone changed more recently: keep it and overwrite the cloud
        const { error: e } = await supabase.from('glowup_state').update({ data: payload(), version: row.version + 1, updated_at: new Date().toISOString() }).eq('user_id', uid);
        if (e) throw e;
        meta.version = row.version + 1;
      }
    } else if (meta.dirtyAt) {
      const next = meta.version + 1;
      const { data: upd, error: e } = await supabase.from('glowup_state')
        .update({ data: payload(), version: next, updated_at: new Date().toISOString() })
        .eq('user_id', uid).eq('version', meta.version).select('version');
      if (e) throw e;
      if (!upd?.length) { busy = false; meta.version = 0; return syncNow(); } // someone else wrote first: re-check
      meta.version = next;
    }
    meta.dirtyAt = null;
    meta.lastSynced = Date.now();
    await saveMeta();
    useSync.setState({ status: 'idle', lastSynced: meta.lastSynced });
  } catch (e: any) {
    useSync.setState({ status: navigator.onLine ? 'error' : 'offline', error: e?.message ?? String(e) });
  } finally {
    busy = false;
  }
}

function schedule(ms = 4000) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; syncNow(); }, ms);
}

let started = false;
export async function startSync() {
  if (started) return;
  started = true;
  meta = { ...meta, ...((await idbGet<Meta>(META_KEY)) ?? {}) };
  useSync.setState({ lastSynced: meta.lastSynced });

  useStore.subscribe((s, prev) => {
    if (applying) return;
    const changed = (Object.keys(s) as (keyof State)[]).some((k) => typeof s[k] !== 'function' && !LOCAL_ONLY.includes(k) && s[k] !== prev[k]);
    if (!changed) return;
    meta.dirtyAt = Date.now();
    saveMeta();
    if (useSync.getState().email) schedule();
  });

  const onSession = (sess: AuthSession | null) => {
    const prevUid = useSync.getState().userId;
    useSync.setState({ email: sess?.user.email ?? null, userId: sess?.user.id ?? null, member: sess && sess.user.id === prevUid ? useSync.getState().member : null, status: sess ? useSync.getState().status === 'off' ? 'idle' : useSync.getState().status : 'off' });
    if (sess) schedule(300);
  };
  const { data } = await supabase.auth.getSession();
  onSession(data.session);
  supabase.auth.onAuthStateChange((e, sess) => { if (e === 'PASSWORD_RECOVERY') useSync.setState({ recovery: true }); onSession(sess); });

  window.addEventListener('online', () => schedule(500));
  document.addEventListener('visibilitychange', () => {
    if (!useSync.getState().email) return;
    if (document.visibilityState === 'visible') schedule(300);
    else if (meta.dirtyAt) syncNow(); // flush before the app is backgrounded
  });
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
  return { needsConfirm: !data.session };
}
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export async function signOut() {
  await syncNow();
  await supabase.auth.signOut();
  meta = { version: 0, lastSynced: null, dirtyAt: meta.dirtyAt, userId: null };
  await saveMeta();
  useSync.setState({ status: 'off', email: null, userId: null, member: null, lastSynced: null });
}
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

const PENDING = 'glowup-pending-join';
export function rememberJoin(code: string, name: string) { try { localStorage.setItem(PENDING, JSON.stringify({ code, name })); } catch { /* */ } }

/** Is the signed-in person in the group? Redeems a saved invite code if needed. */
export async function ensureMember(uid: string): Promise<boolean> {
  if (useSync.getState().member) return true;
  const { data } = await supabase.from('glowup_members').select('user_id').eq('user_id', uid).maybeSingle();
  if (data) { useSync.setState({ member: true }); return true; }
  let pending: { code: string; name: string } | null = null;
  try { pending = JSON.parse(localStorage.getItem(PENDING) ?? 'null'); } catch { /* */ }
  if (pending?.code) {
    const { error } = await supabase.rpc('glowup_join', { p_code: pending.code, p_name: pending.name });
    if (!error) { localStorage.removeItem(PENDING); useSync.setState({ member: true }); return true; }
  }
  useSync.setState({ member: false });
  return false;
}

export async function joinGroup(code: string, name: string) {
  const { error } = await supabase.rpc('glowup_join', { p_code: code, p_name: name });
  if (error) throw error;
  useSync.setState({ member: true });
  try { localStorage.removeItem(PENDING); } catch { /* */ }
  syncNow();
}
