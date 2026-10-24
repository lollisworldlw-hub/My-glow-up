import { useEffect, useState } from 'react';
import { Cloud, CloudOff, LogOut, RefreshCcw } from 'lucide-react';
import { authLinkError, joinGroup, rememberJoin, resetPassword, signIn, signOut, signUp, syncNow, updatePassword, useSync } from '../lib/sync';
import { useStore } from '../lib/store';
import { Card, Field, Sheet, toast } from './ui';

const ago = (t: number | null) => {
  if (!t) return 'not yet';
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

export const inviteFromUrl = () => {
  try { return new URLSearchParams(window.location.search).get('invite')?.toUpperCase() ?? ''; } catch { return ''; }
};

/** Sign in / create account (invite-only) / join the group. Used in Settings, Social and onboarding. */
export function AccountForm({ compact, onDone }: { compact?: boolean; onDone?: () => void }) {
  const name0 = useStore((s) => s.settings.name);
  const { email, member } = useSync();
  const [mode, setMode] = useState<'up' | 'in'>(inviteFromUrl() ? 'up' : 'up');
  const [code, setCode] = useState(inviteFromUrl());
  const [name, setName] = useState(name0 && name0 !== 'beautiful' ? name0 : '');
  const [em, setEm] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { if (email && member && onDone) onDone(); }, [email, member]);

  if (email && member === false) {
    return (
      <div>
        <p className="text-[14px] mb-3">You’re signed in as {email}. Enter an invite code from a friend to join the group.</p>
        <Field label="Your name (friends see this)"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Invite code"><input className="field uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GLOW-XXXXXX" /></Field>
        <button className="btn-primary w-full" disabled={busy || !code || !name.trim()} onClick={async () => {
          setBusy(true);
          try { await joinGroup(code, name.trim()); toast('Welcome to the group'); } catch (e: any) { toast(e?.message ?? 'That code didn’t work'); }
          setBusy(false);
        }}>Join</button>
      </div>
    );
  }
  if (email) return null;

  const go = async () => {
    if (!em.includes('@') || pw.length < 8) { toast('Use your email and a password of 8+ characters'); return; }
    if (mode === 'up' && (!code.trim() || !name.trim())) { toast('Add your name and invite code'); return; }
    setBusy(true);
    try {
      if (mode === 'up') {
        rememberJoin(code.trim(), name.trim());
        const r = await signUp(em.trim(), pw, code.trim(), name.trim());
        if (r.needsConfirm) { setSent(true); setMode('in'); }
        else toast('Account created');
      } else { await signIn(em.trim(), pw); toast('Signed in'); }
      setPw('');
    } catch (e: any) { toast(e?.message ?? 'That didn’t work — try again'); }
    setBusy(false);
  };

  return (
    <div>
      {sent && (
        <div className="rounded-2xl bg-petal px-3 py-2 mb-3 text-[14px]">
          <b>Almost done!</b> We emailed a confirmation link to {em || 'you'}. Tap it (it may open in Safari — that’s fine), then come back here and sign in with the same email and password. You’ll join the group automatically.
        </div>
      )}
      {mode === 'up' && (
        <>
          <Field label="Your name (friends see this)"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Invite code"><input className="field uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GLOW-XXXXXX" /></Field>
        </>
      )}
      <Field label="Email"><input className="field" type="email" autoComplete="email" inputMode="email" value={em} onChange={(e) => setEm(e.target.value)} /></Field>
      <Field label={mode === 'up' ? 'Create a password (8+ characters)' : 'Password'}><input className="field" type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <button className="btn-primary w-full" disabled={busy} onClick={go}>{busy ? 'One moment…' : mode === 'up' ? 'Create my account' : 'Sign in'}</button>
      <div className={`flex justify-between mt-3 text-[13px] ${compact ? '' : ''}`}>
        <button className="text-deep font-medium min-h-[40px]" onClick={() => setMode(mode === 'up' ? 'in' : 'up')}>{mode === 'up' ? 'I already have an account' : 'I have an invite code'}</button>
        {mode === 'in' && <button className="text-muted min-h-[40px]" onClick={async () => { if (!em.includes('@')) { toast('Enter your email first'); return; } try { await resetPassword(em.trim()); toast('Password reset email sent'); } catch (e: any) { toast(e?.message ?? 'Couldn’t send'); } }}>Forgot password?</button>}
      </div>
    </div>
  );
}

export function CloudCard() {
  const { status, email, lastSynced, error, recovery, member } = useSync();
  const [newPw, setNewPw] = useState('');
  return (
    <Card>
      <div className="flex items-start gap-2 mb-3">
        {email && member ? <Cloud className="text-deep shrink-0" size={22} /> : <CloudOff className="text-muted shrink-0" size={22} />}
        <div>
          <div className="font-semibold">{email && member ? 'Your account & cloud backup' : 'Account & cloud backup'}</div>
          <p className="text-[13px] text-muted">{email && member
            ? `Signed in as ${email}. Last synced ${ago(lastSynced)}${status === 'syncing' ? ' · syncing…' : status === 'offline' ? ' · waiting for internet' : status === 'error' ? ' · will retry' : ''}.`
            : 'Your account backs up everything except photos to a private cloud space only you can open, and unlocks the Social tab. Sign-up needs an invite code.'}</p>
          {status === 'error' && error && <p className="text-[13px] text-deep mt-1">{error}</p>}
        </div>
      </div>
      {email && member ? (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-soft btn-sm" onClick={async () => { await syncNow(); toast('Synced'); }}><RefreshCcw size={16} />Sync now</button>
          <button className="btn-ghost btn-sm" onClick={() => useSync.setState({ recovery: true })}>Change password</button>
          <button className="btn-ghost btn-sm" onClick={async () => { await signOut(); toast('Signed out — data stays on this phone'); }}><LogOut size={16} />Sign out</button>
        </div>
      ) : (
        <>
          <AccountForm />
          {email && <button className="btn-ghost btn-sm w-full mt-3" onClick={() => signOut()}><LogOut size={16} />Sign out</button>}
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
