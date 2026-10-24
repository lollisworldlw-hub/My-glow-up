import { useEffect, useState } from 'react';
import { Copy, HeartPulse, RefreshCcw } from 'lucide-react';
import { useSync } from '../lib/sync';
import { newStepsKey, pullSteps, removeStepsKey, stepsStatus, STEPS_URL } from '../lib/healthSteps';
import { Sheet, toast } from './ui';

const copy = async (t: string, what: string) => { try { await navigator.clipboard.writeText(t); toast(`${what} copied`); } catch { toast('Couldn’t copy — press and hold to copy instead'); } };

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 mb-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-[12px] break-all select-all">{value}</code>
        <button className="btn-soft btn-sm shrink-0" onClick={() => copy(value, label)}><Copy size={13} />Copy</button>
      </div>
    </div>
  );
}

export function HealthConnectButton() {
  const { member } = useSync();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{ connected: boolean; lastUsed: string | null } | null>(null);
  useEffect(() => { if (member) stepsStatus().then(setStatus); }, [member, open]);
  return (
    <>
      <button className="btn-soft btn-sm w-full mt-2" onClick={() => member ? setOpen(true) : toast('Sign in first (Social tab) to connect Apple Health')}>
        <HeartPulse size={15} />{status?.connected ? `Apple Health connected${status.lastUsed ? ` · last ${new Date(status.lastUsed).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}` : 'Sync steps from Apple Health'}
      </button>
      {open && <HealthSheet onClose={() => setOpen(false)} connected={!!status?.connected} />}
    </>
  );
}

function HealthSheet({ onClose, connected }: { onClose: () => void; connected: boolean }) {
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const make = async () => { setBusy(true); try { setKey(await newStepsKey()); } catch (e: any) { toast(e?.message ?? 'Couldn’t make a key'); } setBusy(false); };
  return (
    <Sheet open onClose={onClose} title="Steps from Apple Health">
      <p className="text-[13px] text-muted mb-3">iPhone only lets App Store apps read Health directly, so a free Shortcut sends your step count here automatically. One-time setup, about 3 minutes.</p>
      {!key ? (
        <>
          <button className="btn-primary w-full mb-2" disabled={busy} onClick={make}>{connected ? 'Make a new key (replaces the old one)' : 'Start: make my private key'}</button>
          {connected && <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost btn-sm" onClick={async () => { await pullSteps(); toast('Steps refreshed'); }}><RefreshCcw size={14} />Refresh now</button>
            <button className="btn-ghost btn-sm" onClick={async () => { await removeStepsKey(); toast('Disconnected'); onClose(); }}>Disconnect</button>
          </div>}
        </>
      ) : (
        <>
          <CopyRow label="Your private key (keep it secret)" value={key} />
          <CopyRow label="Web address" value={STEPS_URL} />
          <ol className="list-decimal pl-5 space-y-2 text-[14px] mt-3">
            <li>Open the <b>Shortcuts</b> app → <b>+</b> (top right). Name it <b>Glow-Up Steps</b>.</li>
            <li>Add action <b>Find Health Samples</b>. Set: Type <b>is Steps</b> · tap <b>Add Filter</b> → <b>Start Date is Today</b> · <b>Group By: Day</b> (important — this gives one daily total without double-counting your Watch).</li>
            <li>Add action <b>Get Contents of URL</b>. Paste the web address. Tap the arrow → Method <b>POST</b> → Request Body <b>JSON</b>. Add two <b>Text</b> fields:
              <ul className="list-disc pl-5 mt-1">
                <li><b>key</b> → paste your private key</li>
                <li><b>steps</b> → tap the field, choose the variable <b>Health Samples</b></li>
              </ul>
            </li>
            <li>Tap ▶︎ to run it once and allow Health access. You should see “Saved … steps”.</li>
            <li>Make it automatic: <b>Automation</b> tab → <b>+</b> → <b>Time of Day</b> → e.g. <b>9:00 PM, Daily</b> → <b>Run Immediately</b> → Next → pick <b>Glow-Up Steps</b>. Add more times (like noon and 5 PM) for updates through the day.</li>
          </ol>
          <p className="text-[12px] text-muted mt-3">Steps show up in the app within a few minutes of each run. Your key only lets the Shortcut add step counts to your account — nothing else.</p>
          <button className="btn-primary w-full mt-3" onClick={async () => { await pullSteps(); toast('Checking for steps…'); onClose(); }}>Done</button>
        </>
      )}
    </Sheet>
  );
}
