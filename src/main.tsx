import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { useSync } from './lib/sync';
import { useSocial } from './lib/social';

// handles for automated UI tests
(window as any).__glowup = { useSync, useSocial };
import './index.css';

// Updates: check for a new version on launch, every minute, and whenever the app comes back
// to the foreground. When one is found it installs and the app reloads itself automatically.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => { if (navigator.onLine) reg.update().catch(() => {}); };
    setInterval(check, 60_000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  }
});
const hadController = !!navigator.serviceWorker?.controller;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (hadController) try { sessionStorage.setItem('glowup-updated', '1'); } catch { /* */ }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
