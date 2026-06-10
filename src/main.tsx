// Safe Interceptor for Restricted Iframe Environments
// Solves: "Uncaught TypeError: Cannot set property fetch of #<Window> which has only a getter"
try {
  const targets = typeof window !== 'undefined' ? [window, globalThis] : [globalThis];
  targets.forEach((target) => {
    try {
      const proto = Object.getPrototypeOf(target);
      const desc = Object.getOwnPropertyDescriptor(target, 'fetch') || (proto ? Object.getOwnPropertyDescriptor(proto, 'fetch') : undefined);
      if (desc && desc.configurable && !desc.set) {
        let currentFetch = target.fetch;
        Object.defineProperty(target, 'fetch', {
          get() {
            return currentFetch;
          },
          set(val) {
            currentFetch = val;
          },
          configurable: true,
          enumerable: true,
        });
      }
    } catch {
      // Ignored
    }
  });
} catch {
  // Ignored
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import { PresetProvider } from './context/PresetContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <PresetProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </PresetProvider>
    </LanguageProvider>
  </StrictMode>,
);

// High-Fidelity PWA Offline Sync Engine
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[APEX Shell] Service Worker registered successfully, scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[APEX Shell] Offline Service Worker failed to register: ', error);
      });
  });
}

