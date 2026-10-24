import { useEffect, useState } from 'react';
import { Cloud, CloudOff, LogOut, RefreshCcw } from 'lucide-react';
import { authLinkError, joinGroup, rememberJoin, resetPassword, signIn, signOut, signUp, syncNow, updatePassword, useSync } from '../lib/sync';
import { useStore } from '../lib/store';
import { Card, Field, Sheet, toast } from './ui';
import { AuthForm, JoinGroupCard } from './Auth';

const ago = (t: number | null) => {
  if (!t) return 'not yet';
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

export { inviteFromUrl } from './Auth';
export { AuthForm as AccountForm } from './Auth';

export function CloudCard() {
  const { status, email, lastSynced, error, recovery, member } = useSync();
  const [newPw, setNewPw] = useState('');
  return (
    <Card>
      {email ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full grid place-items-center text-[15px] font-semibold shrink-0" style={{ background: 'var(--petal)' }}>{email.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{email}</div>
              <div className="text-[13px] text-muted">{status === 'syncing' ? 'Saving…' : status === 'offline' ? 'Offline. Changes save when you’re back online.' : status === 'error' ? 'Couldn’t save just now. Trying again soon.' : 'Everything saves to your account automatically.'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost btn-sm" onClick={() => useSync.setState({ recovery: true })}>Change password</button>
            <button className="btn-ghost btn-sm" onClick={async () => { await syncNow(); await signOut(); toast('Signed out'); }}><LogOut size={16} />Sign out</button>
          </div>
        </>
      ) : (
        <>
          <div className="font-semibold mb-1">Sign in to save your plan</div>
          <p className="text-[13px] text-muted mb-4">Your plan, logs and chats save to your account so they’re on any phone you sign in on.</p>
          <AuthForm start="signin" />
        </>
      )}
    </Card>
  );
}

/** Shown anywhere in the app when someone opens a password-reset link (or an expired one). */
export function RecoverySheet() {
  const recovery = useSync((x) => x.recovery);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [linkErr, setLinkErr] = useState<string | null>(authLinkError);
  const [em, setEm] = useState('');
  if (linkErr && !recovery) return (
    <Sheet open onClose={() => setLinkErr(null)} title="That link has expired">
      <p className="text-[14px] text-muted mb-3">Email links only work once and expire after a while. Enter your email to get a fresh one, then tap it right away.</p>
      <Field label="Email"><input className="field" type="email" inputMode="email" autoComplete="email" value={em} onChange={(e) => setEm(e.target.value)} /></Field>
      <button className="btn-primary w-full" disabled={busy || !em.includes('@')} onClick={async () => {
        setBusy(true);
        try { await resetPassword(em.trim()); toast('New reset email sent'); setLinkErr(null); } catch (e: any) { toast(e?.message ?? 'Couldn’t send'); }
        setBusy(false);
      }}>Send a new reset link</button>
    </Sheet>
  );
  if (!recovery) return null;
  return (
    <Sheet open onClose={() => useSync.setState({ recovery: false })} title={done ? 'Password updated' : 'Set a new password'}>
      {done ? (
        <>
          <p className="text-[14px] mb-3">You’re all set. Open My Glow-Up from your Home Screen icon and sign in with your new password.</p>
          <button className="btn-primary w-full" onClick={() => useSync.setState({ recovery: false })}>Done</button>
        </>
      ) : (
        <>
          <Field label="New password (8+ characters)"><input className="field" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <button className="btn-primary w-full" disabled={busy || pw.length < 8} onClick={async () => {
            setBusy(true);
            try { await updatePassword(pw); setDone(true); }
            catch (e: any) { toast(e?.message ?? 'Couldn’t update — request a new reset link'); }
            setBusy(false);
          }}>Save new password</button>
        </>
      )}
    </Sheet>
  );
}
