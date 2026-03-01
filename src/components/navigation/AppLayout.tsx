'use client';

import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { PageTransition } from '@/components/ui/PageTransition';
import { useApp } from '@/contexts/AppContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();

  // Re-send reminder schedule to SW on every page load so it survives SW restarts
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;

    // Listen for SW asking for reminder settings (on SW activation)
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GET_REMINDER_SETTINGS' && settings.reminderEnabled) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.active?.postMessage({ type: 'SCHEDULE_REMINDER', time: settings.reminderTime });
        });
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);

    // Proactively re-schedule if reminders are enabled
    if (settings.reminderEnabled) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: 'SCHEDULE_REMINDER', time: settings.reminderTime });
      });
    }

    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [settings.reminderEnabled, settings.reminderTime]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
