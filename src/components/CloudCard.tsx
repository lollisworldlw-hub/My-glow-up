import { useState } from 'react';
import { Cloud, CloudOff, LogOut, RefreshCcw } from 'lucide-react';
import { resetPassword, signIn, signOut, signUp, syncNow, updatePassword, useSync } from '../lib/sync';
import { Card, Field, Sheet, toast } from './ui';

const ago = (t: number | null) => {
  if (!t) return 'not yet';
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

export function CloudCard() {
  const { status, email, lastSynced, error, recovery } = useSync();
  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [em, setEm] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [newPw, setNewPw] = useState('');

  const go = async () => {
    if (!em.includes('@') || pw.length < 8) { toast('Use your email and a password of 8+ characters'); return; }
    setBusy(true);
    try {
      if (mode === 'up') {
        const r = await signUp(em.trim(), pw);
        toast(r.needsConfirm ? 'Check your email to confirm, then sign in here' : 'Cloud backup is on ♡');
        if (r.needsConfirm) setMode('in');
      } else { await signIn(em.trim(), pw); toast('Signed in — syncing your data ♡'); }
      setPw('');
    } catch (e: any) { toast(e?.message ?? 'That didn’t work — try again'); }
    setBusy(false);
  };

  return (
    <Card>
      <div className="flex items-start gap-3 mb-3">
        {email ? <Cloud className="text-deep shrink-0" size={22} /> : <CloudOff className="text-muted shrink-0" size={22} />}
        <div>
          <div className="font-semibold">{email ? 'Cloud backup is on' : 'Cloud backup & sync'}</div>
          <p className="text-[14px] text-muted">{email
            ? `Signed in as ${email}. Last synced ${ago(lastSynced)}${status === 'syncing' ? ' · syncing…' : status === 'offline' ? ' · waiting for internet' : status === 'error' ? ' · will retry' : ''}.`
            : 'Saves everything except photos to your private cloud account, so a lost or new phone never wipes your progress. Sign in on another device to sync.'}</p>
          {status === 'error' && error && <p className="text-[13px] text-deep mt-1">{error}</p>}
        </div>
      </div>
      {email ? (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-soft btn-sm" onClick={async () => { await syncNow(); toast('Synced'); }}><RefreshCcw size={16} />Sync now</button>
          <button className="btn-ghost btn-sm" onClick={async () => { await signOut(); toast('Signed out — data stays on this phone'); }}><LogOut size={16} />Sign out</button>
        </div>
      ) : (
        <>
          <Field label="Email"><input className="field" type="email" autoComplete="email" inputMode="email" value={em} onChange={(e) => setEm(e.target.value)} /></Field>
          <Field label={mode === 'up' ? 'Create a password (8+ characters)' : 'Password'}><input className="field" type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <button className="btn-primary w-full" disabled={busy} onClick={go}>{busy ? 'One moment…' : mode === 'up' ? 'Create account & back up' : 'Sign in'}</button>
          <div className="flex justify-between mt-3 text-[14px]">
            <button className="text-deep font-medium" onClick={() => setMode(mode === 'up' ? 'in' : 'up')}>{mode === 'up' ? 'I already have an account' : 'Create an account instead'}</button>
            {mode === 'in' && <button className="text-muted" onClick={async () => { if (!em.includes('@')) { toast('Enter your email first'); return; } try { await resetPassword(em.trim()); toast('Password reset email sent'); } catch (e: any) { toast(e?.message ?? 'Couldn’t send'); } }}>Forgot?</button>}
          </div>
        </>
      )}
      {recovery && (
        <Sheet open onClose={() => useSync.setState({ recovery: false })} title="Set a new password">
          <Field label="New password (8+ characters)"><input className="field" type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></Field>
          <button className="btn-primary w-full" disabled={newPw.length < 8} onClick={async () => { try { await updatePassword(newPw); toast('Password updated ♡'); } catch (e: any) { toast(e?.message ?? 'Couldn’t update'); } }}>Save password</button>
        </Sheet>
      )}
    </Card>
  );
}
