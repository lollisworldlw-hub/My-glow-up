import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { useSync } from './lib/sync';
import { useSocial } from './lib/social';
import { setRegistration, startUpdater } from './lib/updater';
import { startPushSync } from './lib/push';
import { startStepsPull } from './lib/healthSteps';

// handles for automated UI tests
(window as any).__glowup = { useSync, useSocial };

registerSW({ immediate: true, onRegisteredSW(_url, reg) { setRegistration(reg); } });
startUpdater();
startPushSync();
startStepsPull();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
