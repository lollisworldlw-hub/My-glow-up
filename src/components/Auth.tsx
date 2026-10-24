import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { joinGroup, rememberJoin, resetPassword, signIn, signUp, useSync } from '../lib/sync';
import { useStore } from '../lib/store';

export const inviteFromUrl = () => {
  try { return new URLSearchParams(window.location.search).get('invite')?.toUpperCase() ?? ''; } catch { return ''; }
};

/** Turn Supabase's technical errors into plain sentences. */
export function friendly(e: unknown): string {
  const m = String((e as any)?.message ?? e ?? '').toLowerCase();
  if (m.includes('invalid login')) return 'That email and password don’t match. Check them, or tap “Forgot password”.';
  if (m.includes('email not confirmed')) return 'Your email isn’t confirmed yet. Tap the link we emailed you, then sign in again.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'There’s already an account with that email. Sign in instead.';
  if (m.includes('invite') || m.includes('code')) return 'That invite code didn’t work. Check it with the friend who sent it.';
  if (m.includes('password') && m.includes('6')) return 'Use a password with at least 8 characters.';
  if (m.includes('rate') || m.includes('too many')) return 'Too many tries. Wait a minute and try again.';
  if (m.includes('fetch') || m.includes('network')) return 'Can’t reach the internet. Check your connection and try again.';
  return (e as any)?.message ?? 'Something went wrong. Try again.';
}

export function TextField({ label, hint, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[13px] font-medium mb-1.5">{label}</span>
      <input className="field !min-h-[48px]" {...p} />
      {hint && <span className="block text-[12px] text-muted mt-1">{hint}</span>}
    </label>
  );
}

export function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block mb-3.5">
      <span className="block text-[13px] font-medium mb-1.5">{label}</span>
      <div className="relative">
        <input className="field !min-h-[48px] pr-12" type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center text-muted" onClick={() => setShow(!show)}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

export function ErrorNote({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div role="alert" className="rounded-[14px] px-3.5 py-3 mb-3.5 text-[14px] leading-snug" style={{ background: 'color-mix(in srgb, #B4533F 10%, transparent)', color: '#8A3A2A' }}>{msg}</div>;
}

/**
 * The whole account flow in one place.
 * join: invite code + name + email + password → (check email) → signed in
 * signin: email + password, with forgot-password inline
 */
export function AuthForm({ start = 'join', onSignedIn, onSwitch }: { start?: 'join' | 'signin'; onSignedIn?: () => void; onSwitch?: (m: 'join' | 'signin') => void }) {
  const name0 = useStore((s) => s.settings.name);
  const { email: signedInAs, member } = useSync();
  const [mode, setMode] = useState<'join' | 'signin' | 'check' | 'reset-sent'>(start);
  const [code, setCode] = useState(inviteFromUrl());
  const [name, setName] = useState(name0 || '');
  const [em, setEm] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (signedInAs && member && onSignedIn) onSignedIn(); }, [signedInAs, member]);
  useEffect(() => setErr(''), [mode]);

  const run = async (fn: () => Promise<void>) => {
    setErr(''); setBusy(true);
    try { await fn(); } catch (e) { setErr(friendly(e)); }
    setBusy(false);
  };

  // Signed in but not in the group yet: just ask for the code.
  if (signedInAs && member === false) {
    return (
      <div>
        <p className="text-[14px] text-muted mb-4">You’re signed in as <b className="text-ink">{signedInAs}</b>. Enter the invite code a friend sent you to join the group.</p>
        <ErrorNote msg={err} />
        <TextField label="Invite code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GLOW-XXXXXX" autoCapitalize="characters" autoCorrect="off" />
        <TextField label="Your name" hint="This is what friends see." value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        <button className="btn-primary w-full !min-h-[50px]" disabled={busy || !code.trim() || !name.trim()} onClick={() => run(async () => { await joinGroup(code.trim(), name.trim()); })}>
          {busy ? 'Joining…' : 'Join the group'}
        </button>
      </div>
    );
  }
  if (signedInAs) return <p className="text-[14px] text-muted">Signing you in…</p>;

  if (mode === 'check') return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full grid place-items-center mx-auto mb-4" style={{ background: 'var(--petal)' }}><Mail size={24} strokeWidth={1.6} /></div>
      <h2 className="h-serif text-[26px] leading-tight">Check your email</h2>
      <p className="text-[14px] text-muted mt-2 mb-6 leading-relaxed">We sent a link to <b className="text-ink">{em}</b>. Tap it to confirm your account. It may open in Safari, which is fine. Then come back here.</p>
      <ErrorNote msg={err} />
      <button className="btn-primary w-full !min-h-[50px]" disabled={busy} onClick={() => run(async () => { await signIn(em.trim(), pw); onSignedIn?.(); })}>
        {busy ? 'Checking…' : 'I tapped the link, sign me in'}
      </button>
      <p className="text-[13px] text-muted mt-4">No email after a few minutes? Check spam, or ask whoever invited you to confirm your account from Admin.</p>
    </div>
  );

  if (mode === 'reset-sent') return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full grid place-items-center mx-auto mb-4" style={{ background: 'var(--petal)' }}><Mail size={24} strokeWidth={1.6} /></div>
      <h2 className="h-serif text-[26px] leading-tight">Reset link sent</h2>
      <p className="text-[14px] text-muted mt-2 mb-6 leading-relaxed">We emailed <b className="text-ink">{em}</b> a link to choose a new password. Tap it and you’ll be asked for the new one.</p>
      <button className="btn-ghost w-full !min-h-[50px]" onClick={() => setMode('signin')}>Back to sign in</button>
    </div>
  );

  if (mode === 'signin') return (
    <div>
      <ErrorNote msg={err} />
      <TextField label="Email" type="email" inputMode="email" autoComplete="email" autoCapitalize="off" value={em} onChange={(e) => setEm(e.target.value)} />
      <PasswordField label="Password" value={pw} onChange={setPw} autoComplete="current-password" />
      <button className="btn-primary w-full !min-h-[50px] mt-1" disabled={busy || !em.includes('@') || !pw} onClick={() => run(async () => { await signIn(em.trim(), pw); onSignedIn?.(); })}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <div className="flex justify-between items-center mt-3 text-[14px]">
        <button className="min-h-[44px] text-muted" onClick={() => {
          if (!em.includes('@')) { setErr('Type your email first, then tap “Forgot password”.'); return; }
          run(async () => { await resetPassword(em.trim()); setMode('reset-sent'); });
        }}>Forgot password?</button>
        <button className="min-h-[44px] font-medium" onClick={() => (onSwitch ? onSwitch('join') : setMode('join'))}>New here? Join</button>
      </div>
    </div>
  );

  // join
  return (
    <div>
      <ErrorNote msg={err} />
      <TextField label="Invite code" hint="From the friend who invited you." value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GLOW-XXXXXX" autoCapitalize="characters" autoCorrect="off" />
      <TextField label="First name" hint="Friends see this." value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
      <TextField label="Email" type="email" inputMode="email" autoComplete="email" autoCapitalize="off" value={em} onChange={(e) => setEm(e.target.value)} />
      <PasswordField label="Create a password" value={pw} onChange={setPw} autoComplete="new-password" />
      <p className="text-[12px] text-muted -mt-2 mb-4">At least 8 characters.</p>
      <button className="btn-primary w-full !min-h-[50px]" disabled={busy || !code.trim() || !name.trim() || !em.includes('@') || pw.length < 8}
        onClick={() => run(async () => {
          rememberJoin(code.trim(), name.trim());
          const r = await signUp(em.trim(), pw, code.trim(), name.trim());
          if (!name0) useStore.getState().set((x) => { x.settings.name = name.trim(); });
          if (r.needsConfirm) setMode('check'); else onSignedIn?.();
        })}>
        {busy ? 'Creating your account…' : 'Create account'}
      </button>
      <div className="text-center mt-3 text-[14px]">
        <button className="min-h-[44px] font-medium" onClick={() => (onSwitch ? onSwitch('signin') : setMode('signin'))}>Already have an account? Sign in</button>
      </div>
    </div>
  );
}
