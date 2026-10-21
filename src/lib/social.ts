import { create } from 'zustand';
import { supabase, useSync } from './sync';

export interface Member { user_id: string; display_name: string; emoji: string; bio: string; joined_at: string }
export interface Message { id: number; sender: string; recipient: string | null; kind: 'text' | 'achievement'; body: string; meta: any; created_at: string }
export interface Reaction { message_id: number; user_id: string; emoji: string }

interface SocialState {
  members: Record<string, Member>;
  messages: Message[];
  reactions: Reaction[];
  loaded: boolean;
  error: string | null;
  lastRead: Record<string, number>; // 'group' or peer id -> message id
}

const LR = 'glowup-last-read';
const loadLR = () => { try { return JSON.parse(localStorage.getItem(LR) ?? '{}'); } catch { return {}; } };

export const useSocial = create<SocialState>(() => ({ members: {}, messages: [], reactions: [], loaded: false, error: null, lastRead: loadLR() }));

export async function loadSocial() {
  try {
    const [m, msg] = await Promise.all([
      supabase.from('glowup_members').select('*'),
      supabase.from('glowup_messages').select('*').order('id', { ascending: false }).limit(400)
    ]);
    if (m.error) throw m.error;
    if (msg.error) throw msg.error;
    const messages = (msg.data as Message[]).reverse();
    const ids = messages.map((x) => x.id);
    const r = ids.length ? await supabase.from('glowup_reactions').select('message_id,user_id,emoji').in('message_id', ids) : { data: [], error: null };
    useSocial.setState({
      members: Object.fromEntries((m.data as Member[]).map((x) => [x.user_id, x])),
      messages, reactions: (r.data as Reaction[]) ?? [], loaded: true, error: null
    });
  } catch (e: any) {
    useSocial.setState({ error: e?.message ?? 'Couldn’t load', loaded: true });
  }
}

let channel: ReturnType<typeof supabase.channel> | null = null;
let poll: ReturnType<typeof setInterval> | null = null;
export function startLive() {
  if (channel) return;
  channel = supabase.channel('glowup-social')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'glowup_messages' }, () => loadSocial())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'glowup_reactions' }, () => loadSocial())
    .subscribe();
  // safety net if realtime is unavailable
  poll = setInterval(() => { if (document.visibilityState === 'visible') loadSocial(); }, 20000);
}
export function stopLive() {
  if (channel) { supabase.removeChannel(channel); channel = null; }
  if (poll) { clearInterval(poll); poll = null; }
}

export async function send(body: string, recipient: string | null, kind: 'text' | 'achievement' = 'text', meta: any = {}) {
  const uid = useSync.getState().userId;
  if (!uid) throw new Error('Please sign in');
  const text = body.trim().slice(0, 2000);
  if (!text) return;
  const { error } = await supabase.from('glowup_messages').insert({ sender: uid, recipient, kind, body: text, meta });
  if (error) throw error;
  await loadSocial();
}

export async function removeMessage(id: number) {
  const { error } = await supabase.from('glowup_messages').delete().eq('id', id);
  if (error) throw error;
  useSocial.setState((s) => ({ messages: s.messages.filter((m) => m.id !== id) }));
}

export async function toggleReaction(messageId: number, emoji: string) {
  const uid = useSync.getState().userId;
  if (!uid) return;
  const has = useSocial.getState().reactions.some((r) => r.message_id === messageId && r.user_id === uid && r.emoji === emoji);
  // optimistic
  useSocial.setState((s) => ({ reactions: has ? s.reactions.filter((r) => !(r.message_id === messageId && r.user_id === uid && r.emoji === emoji)) : [...s.reactions, { message_id: messageId, user_id: uid, emoji }] }));
  const q = has
    ? supabase.from('glowup_reactions').delete().eq('message_id', messageId).eq('user_id', uid).eq('emoji', emoji)
    : supabase.from('glowup_reactions').insert({ message_id: messageId, user_id: uid, emoji });
  const { error } = await q;
  if (error) loadSocial();
}

export async function updateProfile(p: Partial<Pick<Member, 'display_name' | 'emoji' | 'bio'>>) {
  const uid = useSync.getState().userId;
  if (!uid) return;
  const { error } = await supabase.from('glowup_members').update(p).eq('user_id', uid);
  if (error) throw error;
  await loadSocial();
}

const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export async function createInvite(): Promise<string> {
  const uid = useSync.getState().userId;
  if (!uid) throw new Error('Please sign in');
  const rnd = crypto.getRandomValues(new Uint8Array(6));
  const code = 'GLOW-' + Array.from(rnd).map((b) => ALPH[b % ALPH.length]).join('');
  const { error } = await supabase.from('glowup_invites').insert({ code, created_by: uid });
  if (error) throw error;
  return code;
}

export async function myInvites() {
  const uid = useSync.getState().userId;
  if (!uid) return [];
  const { data } = await supabase.from('glowup_invites').select('code,used_by,created_at,used_at').eq('created_by', uid).order('created_at', { ascending: false });
  return (data ?? []) as { code: string; used_by: string | null; created_at: string; used_at: string | null }[];
}

export async function leaveGroup() {
  const uid = useSync.getState().userId;
  if (!uid) return;
  await supabase.from('glowup_messages').delete().eq('sender', uid);
  await supabase.from('glowup_state').delete().eq('user_id', uid);
  const { error } = await supabase.from('glowup_members').delete().eq('user_id', uid);
  if (error) throw error;
  useSync.setState({ member: false });
}

export function markRead(key: string) {
  const msgs = useSocial.getState().messages;
  const last = msgs.length ? msgs[msgs.length - 1].id : 0;
  const lr = { ...useSocial.getState().lastRead, [key]: last };
  useSocial.setState({ lastRead: lr });
  try { localStorage.setItem(LR, JSON.stringify(lr)); } catch { /* */ }
}

export function unreadCount(uid: string | null): number {
  if (!uid) return 0;
  const { messages, lastRead } = useSocial.getState();
  return messages.filter((m) => m.sender !== uid && (m.recipient === null ? m.id > (lastRead.group ?? 0) : m.recipient === uid && m.id > (lastRead[m.sender] ?? 0))).length;
}
