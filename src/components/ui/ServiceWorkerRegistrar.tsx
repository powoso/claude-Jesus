'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Re-schedule reminder if enabled (in case SW was restarted)
      try {
        const raw = localStorage.getItem('dw-settings');
        if (!raw) return;
        const settings = JSON.parse(raw);
        if (settings.reminderEnabled && settings.reminderTime) {
          const sw = reg.active || reg.installing || reg.waiting;
          sw?.postMessage({ type: 'SCHEDULE_REMINDER', time: settings.reminderTime });
        }
      } catch { /* ignore */ }
    }).catch(() => {
      // Service worker registration failed — app still works fine without it
    });
  }, []);

  return null;
}
