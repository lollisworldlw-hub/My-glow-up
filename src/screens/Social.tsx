import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Copy, Lock, LogOut, Send, Share2, Smile, Trophy, Trash2, UserPlus } from 'lucide-react';
import { useStore } from '../lib/store';
import { useSync } from '../lib/sync';
import { useSocial, loadSocial, startLive, send, removeMessage, toggleReaction, updateProfile, createInvite, myInvites, leaveGroup, markRead, type Message } from '../lib/social';
import { computeAchievements, type Achievement } from '../lib/achievements';
import { useToday } from '../lib/derived';
import { Card, Empty, Field, Header, Segmented, Sheet, toast } from '../components/ui';
import { AccountForm } from '../components/CloudCard';
import { useUI } from '../lib/ui';

const REACTIONS = ['❤️', '👏', '🔥', '💪'];
const EMOJIS = ['🌸', '🌷', '🦋', '🌙', '⭐', '🍓', '🐝', '🌻', '🍒', '🦩', '🐚', '🌈', '💎', '🎀', '🐱', '🐶'];

const timeLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  return same ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export default function Social() {
  const { email, member, userId } = useSync();
  const sub = (useUI((u) => u.sub.social) ?? 'group') as 'group' | 'messages' | 'friends';
  const setSub = useUI((u) => u.setSub);
  const loaded = useSocial((s) => s.loaded);
  const error = useSocial((s) => s.error);

  useEffect(() => { if (email && member) { loadSocial(); startLive(); } }, [email, member]);

  if (!email || member === false || member === null) {
    return (
      <div>
        <Header eyebrow="Friends & cheering" title="Social" />
        <Card>
          <div className="flex gap-3 items-start mb-4">
            <span className="w-11 h-11 rounded-full bg-petal text-deep grid place-items-center shrink-0"><Lock size={19} /></span>
            <p className="text-[15px]">Chat with your friends, share wins, and cheer each other on. <b>Your weight, food, cycle, mood and everything else stay private</b> — friends only see your name, emoji, and what you choose to post.</p>
          </div>
          {email && member === null ? <p className="text-muted">Checking your account…</p> : <AccountForm />}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header eyebrow="Friends & cheering" title="Social" />
      <div className="mb-4"><Segmented value={sub} onChange={(v) => setSub('social', v)} options={[{ value: 'group', label: 'Group' }, { value: 'messages', label: 'Messages' }, { value: 'friends', label: 'Friends' }]} /></div>
      {!loaded ? <p className="text-muted">Loading…</p> : error ? <Card><p>Couldn’t reach the group right now. {error}</p><button className="btn-soft btn-sm mt-3" onClick={loadSocial}>Try again</button></Card> : (
        <>
          {sub === 'group' && <Thread peer={null} me={userId!} />}
          {sub === 'messages' && <DMList me={userId!} />}
          {sub === 'friends' && <Friends me={userId!} />}
        </>
      )}
    </div>
  );
}

function Bubble({ m, me, onLong }: { m: Message; me: string; onLong: () => void }) {
  const member = useSocial((s) => s.members[m.sender]);
  const reactions = useSocial((s) => s.reactions.filter((r) => r.message_id === m.id));
  const [picker, setPicker] = useState(false);
  const mine = m.sender === me;
  const counts = REACTIONS.map((e) => ({ e, n: reactions.filter((r) => r.emoji === e).length, mine: reactions.some((r) => r.emoji === e && r.user_id === me) })).filter((x) => x.n);

  return (
    <div className={`flex gap-2 ${mine ? 'justify-end' : ''}`}>
      {!mine && <div className="w-9 h-9 rounded-full bg-petal grid place-items-center text-[18px] shrink-0 mt-5" aria-hidden>{member?.emoji ?? '🌸'}</div>}
      <div className={`max-w-[80%] min-w-0 ${mine ? 'items-end' : ''} flex flex-col`}>
        <div className={`text-[12px] text-muted mb-1 ${mine ? 'text-right' : ''}`}>{mine ? 'You' : member?.display_name ?? 'Friend'} · {timeLabel(m.created_at)}</div>
        {m.kind === 'achievement' ? (
          <button onClick={mine ? onLong : () => setPicker(!picker)} className="rounded-3xl border border-blush bg-card px-4 py-3 text-left shadow-soft">
            <div className="flex items-center gap-3"><span className="text-[30px]">{m.meta?.icon ?? '🏆'}</span>
              <div><div className="eyebrow !text-[11px]">Achievement</div><div className="font-semibold text-[16px] leading-snug">{m.body}</div></div></div>
          </button>
        ) : (
          <button onClick={mine ? onLong : () => setPicker(!picker)} className={`rounded-3xl px-4 py-2.5 text-left text-[16px] whitespace-pre-wrap break-words ${mine ? 'bg-deep text-white rounded-br-lg' : 'bg-card border border-line rounded-bl-lg'}`}>{m.body}</button>
        )}
        <div className={`flex flex-wrap gap-1 mt-1 ${mine ? 'justify-end' : ''}`}>
          {counts.map((c) => <button key={c.e} onClick={() => toggleReaction(m.id, c.e)} className={`rounded-full px-2 py-0.5 text-[13px] border ${c.mine ? 'border-rose bg-petal' : 'border-line bg-card'}`}>{c.e} {c.n}</button>)}
          {!picker && <button aria-label="React" onClick={() => setPicker(true)} className="rounded-full px-2 py-0.5 text-muted border border-line bg-card"><Smile size={14} /></button>}
          {picker && REACTIONS.map((e) => <button key={e} onClick={() => { toggleReaction(m.id, e); setPicker(false); }} className="rounded-full w-9 h-8 text-[16px] bg-petal">{e}</button>)}
        </div>
      </div>
    </div>
  );
}

function Thread({ peer, me }: { peer: string | null; me: string }) {
  const all = useSocial((s) => s.messages);
  const msgs = useMemo(() => all.filter((m) => peer === null ? m.recipient === null : (m.sender === me && m.recipient === peer) || (m.sender === peer && m.recipient === me)), [all, peer, me]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState(false);
  const [del, setDel] = useState<Message | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); markRead(peer ?? 'group'); }, [msgs.length]);

  const post = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await send(text, peer); setText(''); } catch (e: any) { toast(e?.message ?? 'Couldn’t send'); }
    setBusy(false);
  };

  return (
    <>
      <div className="space-y-4 pb-24">
        {msgs.length === 0 && <Empty icon={<Send />} title={peer ? 'Say hi!' : 'Start the conversation'} sub={peer ? 'Only the two of you can see these messages.' : 'Share a win, ask for a recipe, or cheer someone on.'} />}
        {msgs.map((m) => <Bubble key={m.id} m={m} me={me} onLong={() => setDel(m)} />)}
        <div ref={end} />
      </div>
      <div className="fixed inset-x-0 z-30 bg-bg/95 backdrop-blur border-t border-line" style={{ bottom: 'calc(63px + env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-[640px] px-3 py-2 flex gap-2 items-end">
          {peer === null && <button aria-label="Share an achievement" className="w-11 h-11 shrink-0 rounded-full bg-petal text-deep grid place-items-center" onClick={() => setShare(true)}><Trophy size={19} /></button>}
          <textarea aria-label="Message" rows={1} className="field py-2.5 min-h-[44px] max-h-32 flex-1 resize-none" placeholder={peer ? 'Message' : 'Message the group'} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); post(); } }} />
          <button aria-label="Send" disabled={busy || !text.trim()} className="w-11 h-11 shrink-0 rounded-full bg-deep text-white grid place-items-center disabled:opacity-50" onClick={post}><Send size={18} /></button>
        </div>
      </div>
      {share && <ShareSheet onClose={() => setShare(false)} />}
      {del && (
        <Sheet open onClose={() => setDel(null)} title="Your message">
          <p className="text-[15px] mb-4 whitespace-pre-wrap">{del.body}</p>
          <button className="btn-ghost w-full text-deep" onClick={async () => { try { await removeMessage(del.id); toast('Message deleted'); } catch { toast('Couldn’t delete'); } setDel(null); }}><Trash2 size={16} />Delete for everyone</button>
        </Sheet>
      )}
    </>
  );
}

export function ShareSheet({ onClose, preselect }: { onClose: () => void; preselect?: string }) {
  const s = useStore();
  const today = useToday();
  const list = computeAchievements(s, today);
  const [nums, setNums] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState('');
  const fresh = list.filter((a) => !s.shared.includes(a.key));
  const shown = preselect ? list.filter((a) => a.key === preselect) : fresh;

  const share = async (a: Achievement | null) => {
    try {
      if (a) {
        await send(nums[a.key] && a.withNumbers ? a.withNumbers : a.title, null, 'achievement', { icon: a.icon, key: a.key });
        s.set((x) => { if (!x.shared.includes(a.key)) x.shared.push(a.key); });
      } else await send(custom, null, 'achievement', { icon: '🌟' });
      toast('Shared with the group ♡');
      onClose();
    } catch (e: any) { toast(e?.message ?? 'Couldn’t share'); }
  };

  return (
    <Sheet open onClose={onClose} title="Share an achievement">
      <p className="text-[14px] text-muted mb-3">Only the words on the card are shared. Numbers stay private unless you switch them on for that post.</p>
      {shown.length === 0 && <p className="text-[15px] mb-3">No new achievements yet — they appear as you log workouts, habits, and weigh-ins. You can write your own below.</p>}
      <div className="space-y-2 mb-4">
        {shown.map((a) => (
          <div key={a.key} className="card p-3">
            <div className="flex items-center gap-3"><span className="text-[28px]">{a.icon}</span><div className="flex-1 font-medium">{nums[a.key] && a.withNumbers ? a.withNumbers : a.title}</div></div>
            <div className="flex items-center justify-between mt-2 gap-2">
              {a.withNumbers ? (
                <label className="flex items-center gap-2 text-[14px] text-muted"><input type="checkbox" className="w-5 h-5 accent-[var(--rose-deep)]" checked={!!nums[a.key]} onChange={(e) => setNums({ ...nums, [a.key]: e.target.checked })} />Include numbers</label>
              ) : <span />}
              <button className="btn-primary btn-sm" onClick={() => share(a)}><Share2 size={15} />Share</button>
            </div>
          </div>
        ))}
      </div>
      {!preselect && (
        <>
          <Field label="Or write your own win"><input className="field" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Chose a walk over scrolling today!" /></Field>
          <button className="btn-soft w-full" disabled={!custom.trim()} onClick={() => share(null)}>Share my win</button>
        </>
      )}
    </Sheet>
  );
}

function DMList({ me }: { me: string }) {
  const members = useSocial((s) => s.members);
  const messages = useSocial((s) => s.messages);
  const lastRead = useSocial((s) => s.lastRead);
  const [peer, setPeer] = useState<string | null>(null);
  const others = Object.values(members).filter((m) => m.user_id !== me);
  if (peer) {
    const p = members[peer];
    return (
      <div>
        <button className="flex items-center gap-2 text-deep font-medium mb-4 min-h-[40px]" onClick={() => setPeer(null)}><ChevronLeft size={18} />All messages</button>
        <div className="flex items-center gap-3 mb-4"><span className="w-11 h-11 rounded-full bg-petal grid place-items-center text-[22px]">{p?.emoji}</span><div><div className="font-semibold">{p?.display_name}</div><div className="text-[13px] text-muted">Private — only you two can see this</div></div></div>
        <Thread peer={peer} me={me} />
      </div>
    );
  }
  if (!others.length) return <Empty icon={<UserPlus />} title="No friends here yet" sub="Invite someone from the Friends tab." />;
  return (
    <div className="card divide-y divide-line !rounded-2xl">
      {others.map((o) => {
        const thread = messages.filter((m) => (m.sender === me && m.recipient === o.user_id) || (m.sender === o.user_id && m.recipient === me));
        const last = thread[thread.length - 1];
        const unread = thread.filter((m) => m.sender === o.user_id && m.id > (lastRead[o.user_id] ?? 0)).length;
        return (
          <button key={o.user_id} className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setPeer(o.user_id)}>
            <span className="w-11 h-11 rounded-full bg-petal grid place-items-center text-[22px] shrink-0">{o.emoji}</span>
            <span className="flex-1 min-w-0"><span className="block font-medium">{o.display_name}</span><span className="block text-[14px] text-muted truncate">{last ? (last.sender === me ? 'You: ' : '') + last.body : 'Say hi ♡'}</span></span>
            {unread > 0 && <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-deep text-white text-[12px] grid place-items-center">{unread}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Friends({ me }: { me: string }) {
  const members = useSocial((s) => s.members);
  const mine = members[me];
  const [name, setName] = useState(mine?.display_name ?? '');
  const [bio, setBio] = useState(mine?.bio ?? '');
  const [codes, setCodes] = useState<Awaited<ReturnType<typeof myInvites>>>([]);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { myInvites().then(setCodes); }, []);
  const link = (c: string) => `${window.location.origin}/?invite=${c}`;

  const shareCode = async (c: string) => {
    const text = `Join me on My Glow-Up ♡ Your invite code: ${c}\n${link(c)}`;
    try { if (navigator.share) { await navigator.share({ title: 'My Glow-Up invite', text }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(text); toast('Invite copied'); } catch { toast(c); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="eyebrow mb-3">Your profile</div>
        <div className="flex flex-wrap gap-2 mb-4">{EMOJIS.map((e) => <button key={e} aria-label={`Avatar ${e}`} onClick={() => updateProfile({ emoji: e })} className={`w-11 h-11 rounded-full text-[22px] grid place-items-center ${mine?.emoji === e ? 'bg-deep' : 'bg-petal'}`}>{e}</button>)}</div>
        <Field label="Display name"><input className="field" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="A little about you (optional)"><input className="field" value={bio} maxLength={200} onChange={(e) => setBio(e.target.value)} placeholder="Mom of 2, chocolate lover, walking queen" /></Field>
        <button className="btn-soft btn-sm" disabled={!name.trim()} onClick={async () => { try { await updateProfile({ display_name: name.trim(), bio }); toast('Profile saved'); } catch (e: any) { toast(e?.message ?? 'Couldn’t save'); } }}>Save profile</button>
      </Card>

      <Card>
        <div className="eyebrow mb-2">Invite a friend</div>
        <p className="text-[14px] text-muted mb-3">Each code works once. Send it to a friend — they enter it when creating their account.</p>
        <button className="btn-primary w-full mb-3" onClick={async () => { try { const c = await createInvite(); setCodes(await myInvites()); shareCode(c); } catch (e: any) { toast(e?.message ?? 'Couldn’t create a code'); } }}><UserPlus size={18} />Create invite code</button>
        {codes.map((c) => (
          <div key={c.code} className="flex items-center justify-between py-2 border-t border-line">
            <div><div className="font-mono font-semibold tracking-wider">{c.code}</div><div className="text-[13px] text-muted">{c.used_by ? `Used by ${members[c.used_by]?.display_name ?? 'a friend'}` : 'Not used yet'}</div></div>
            {!c.used_by && <button aria-label="Share code" className="btn-soft btn-sm" onClick={() => shareCode(c.code)}><Copy size={15} />Send</button>}
          </div>
        ))}
      </Card>

      <div>
        <h3 className="h-serif text-[22px] mb-2">Members</h3>
        <div className="card divide-y divide-line !rounded-2xl">
          {Object.values(members).sort((a, b) => a.joined_at.localeCompare(b.joined_at)).map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-11 h-11 rounded-full bg-petal grid place-items-center text-[22px] shrink-0">{m.emoji}</span>
              <div className="min-w-0"><div className="font-medium">{m.display_name}{m.user_id === me ? ' (you)' : ''}</div>{m.bio && <div className="text-[14px] text-muted">{m.bio}</div>}</div>
            </div>
          ))}
        </div>
      </div>

      <Card className="bg-petal border-blush">
        <div className="flex gap-3"><Lock size={18} className="text-deep shrink-0 mt-0.5" /><p className="text-[14px]">Friends can see only your profile, group posts, and private messages sent to them. Your weight, goals, meals, cycle, mood and photos are never shared.</p></div>
      </Card>
      <button className="btn-ghost w-full" onClick={() => setLeaving(true)}><LogOut size={16} />Leave the group</button>
      {leaving && (
        <Sheet open onClose={() => setLeaving(false)} title="Leave the group?">
          <p className="text-[15px] mb-4">This removes your profile and all your messages, and deletes your cloud backup. Data on this phone stays. You’d need a new invite code to rejoin.</p>
          <button className="btn-primary w-full" onClick={async () => { try { await leaveGroup(); toast('You left the group'); } catch (e: any) { toast(e?.message ?? 'Couldn’t leave'); } setLeaving(false); }}>Leave & delete my group data</button>
        </Sheet>
      )}
    </div>
  );
}
