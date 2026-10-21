import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { useSync } from './lib/sync';
import { useSocial } from './lib/social';
import { setRegistration, startUpdater } from './lib/updater';

// handles for automated UI tests
(window as any).__glowup = { useSync, useSocial };

registerSW({ immediate: true, onRegisteredSW(_url, reg) { setRegistration(reg); } });
startUpdater();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
