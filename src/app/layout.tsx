import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/contexts/AppContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ServiceWorkerRegistrar } from '@/components/ui/ServiceWorkerRegistrar';

import './globals.css';

export const viewport: Viewport = {
  themeColor: '#7C9070',
};

export const metadata: Metadata = {
  title: 'Daily Walk — A Jesus-Centered Devotional App',
  description: 'Your personal space to grow closer to Jesus, one day at a time. Daily devotionals, prayer journal, Bible reading plans, scripture memory, and more.',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Daily Walk',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SyncProvider>
          <AppProvider>
            <ToastProvider>
              <ServiceWorkerRegistrar />

              {children}
            </ToastProvider>
          </AppProvider>
        </SyncProvider>
      </body>
    </html>
  );
}
