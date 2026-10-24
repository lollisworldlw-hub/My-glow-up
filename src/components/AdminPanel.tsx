import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, UserMinus, ChevronRight, MailCheck } from 'lucide-react';
import { supabase, useSync } from '../lib/sync';
import { Sheet, toast } from './ui';

type Person = { user_id: string; email: string; display_name: string; member: boolean; admin: boolean; confirmed: boolean; last_sign_in: string | null; joined_at: string | null };

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('glowup-admin', { body });
  if (error) {
    let msg = error.message;
    try { msg = (await (error as any).context.json()).error ?? msg; } catch { /* */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useIsAdmin() {
  const { userId } = useSync();
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    if (!userId) { setAdmin(false); return; }
    supabase.rpc('glowup_is_admin').then(({ data }) => setAdmin(!!data));
  }, [userId]);
  return admin;
}

const ago = (d: string | null) => {
  if (!d) return 'never';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
};

export function AdminCard() {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  if (!isAdmin) return null;
  return (
    <>
      <button className="card p-4 w-full flex items-center gap-3 text-left" onClick={() => setOpen(true)}>
        <ShieldCheck size={20} strokeWidth={1.6} className="text-gold shrink-0" />
        <div className="flex-1"><div className="font-medium">Admin</div><div className="text-[13px] text-muted">Reset passwords and manage the group</div></div>
        <ChevronRight size={18} className="text-muted" />
      </button>
      {open && <AdminSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function AdminSheet({ onClose }: { onClose: () => void }) {
  const { userId } = useSync();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [err, setErr] = useState('');
  const [pick, setPick] = useState<Person | null>(null);
  const load = () => call({ action: 'list' }).then((d) => setPeople(d.people)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  return (
    <Sheet open onClose={onClose} title="Admin">
      {err && <p className="text-[14px] text-rose mb-3">{err}</p>}
      {!people && !err && <p className="text-muted text-[14px]">Loading people…</p>}
      {people && (
        <>
          <p className="text-[13px] text-muted mb-3">{people.filter((p) => p.member).length} in the group, {people.length} accounts. Tap someone to manage them.</p>
          <div className="space-y-2">
            {people.map((p) => (
              <button key={p.user_id} className="card p-3.5 w-full flex items-center gap-3 text-left" onClick={() => setPick(p)}>
                <div className="w-9 h-9 rounded-full bg-petal grid place-items-center text-[13px] font-semibold shrink-0">{(p.display_name || p.email || '?').slice(0, 1).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium truncate">{p.display_name || 'No name yet'}{p.user_id === userId ? ' (you)' : ''}</div>
                  <div className="text-[12px] text-muted truncate">{p.email}</div>
                  <div className="text-[12px] text-muted">{p.member ? 'In the group' : 'Not in the group'}{p.admin ? ', admin' : ''}{!p.confirmed ? ', email not confirmed' : ''}, last in {ago(p.last_sign_in)}</div>
                </div>
                <ChevronRight size={18} className="text-muted shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}
      {pick && <PersonSheet p={pick} me={pick.user_id === userId} onClose={() => setPick(null)} onDone={() => { setPick(null); load(); }} />}
    </Sheet>
  );
}

function PersonSheet({ p, me, onClose, onDone }: { p: Person; me: boolean; onClose: () => void; onDone: () => void }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const [wipe, setWipe] = useState(false);
  const run = async (body: Record<string, unknown>, done: string) => {
    setBusy(true);
    try { await call({ ...body, user_id: p.user_id }); toast(done); onDone(); }
    catch (e) { toast((e as Error).message); }
    finally { setBusy(false); }
  };
  const suggest = () => setPw(`Glow-${Math.random().toString(36).slice(2, 6)}-${Math.floor(1000 + Math.random() * 9000)}`);

  return (
    <Sheet open onClose={onClose} title={p.display_name || p.email}>
      <p className="text-[13px] text-muted mb-4">{p.email}</p>

      <div className="label flex items-center gap-1.5"><KeyRound size={14} />Set a temporary password</div>
      <p className="text-[13px] text-muted mb-2">Give it to them privately. They can sign in with it and change it in Settings.</p>
      <div className="flex gap-2 mb-2">
        <input className="field flex-1" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8+ characters" autoCapitalize="off" autoCorrect="off" />
        <button className="btn-soft" onClick={suggest}>Suggest</button>
      </div>
      <button className="btn-primary w-full mb-5" disabled={busy || pw.length < 8} onClick={() => run({ action: 'set_password', password: pw }, `Password set for ${p.display_name || p.email}`)}>Save password</button>

      {!p.confirmed && (
        <button className="btn-ghost w-full mb-5" disabled={busy} onClick={() => run({ action: 'confirm_email' }, 'Email confirmed')}><MailCheck size={16} />Confirm their email so they can sign in</button>
      )}

      {!me && (
        <>
          <div className="label">Admin access</div>
          <button className="btn-ghost w-full mb-5" disabled={busy} onClick={() => run({ action: 'set_admin', on: !p.admin }, p.admin ? 'Admin access removed' : 'Now an admin')}>
            <ShieldCheck size={16} />{p.admin ? 'Remove admin access' : 'Make admin'}
          </button>
        </>
      )}

      {p.member && !me && (
        <>
          <div className="label">Remove from the group</div>
          <p className="text-[13px] text-muted mb-2">They lose access to chat and shared posts. Their own private data stays in their account. They'd need a new invite code to rejoin.</p>
          <label className="flex items-center gap-2 text-[14px] mb-3"><input type="checkbox" checked={wipe} onChange={(e) => setWipe(e.target.checked)} />Also delete their messages</label>
          {!sure
            ? <button className="btn-ghost w-full" onClick={() => setSure(true)}><UserMinus size={16} />Remove from group</button>
            : <button className="btn-primary w-full" disabled={busy} onClick={() => run({ action: 'remove_member', delete_messages: wipe }, 'Removed from the group')}>Yes, remove {p.display_name || 'them'}</button>}
        </>
      )}
    </Sheet>
  );
}
