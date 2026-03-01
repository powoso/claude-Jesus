import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/contexts/AppContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ServiceWorkerRegistrar } from '@/components/ui/ServiceWorkerRegistrar';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';

import './globals.css';

const SITE_URL = 'https://daily-walk.com';
const SITE_NAME = 'Daily Walk';
const SITE_DESCRIPTION = 'Your personal space to grow closer to Jesus, one day at a time. Daily devotionals, prayer journal, Bible reading plans, gratitude wall, and spiritual growth tracking.';

export const viewport: Viewport = {
  themeColor: '#7C9070',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Daily Walk — A Jesus-Centered Devotional App',
    template: '%s | Daily Walk',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'daily devotional', 'Bible reading plan', 'prayer journal', 'Christian app',
    'Jesus', 'spiritual growth', 'Bible study', 'gratitude journal',
    'Scripture', 'devotional app', 'faith', 'Christian devotional',
    'Bible verse of the day', 'prayer tracker', 'worship',
  ],
  authors: [{ name: 'Daily Walk' }],
  creator: 'Daily Walk',
  publisher: 'Daily Walk',
  applicationName: SITE_NAME,
  category: 'Religion & Spirituality',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Daily Walk — A Jesus-Centered Devotional App',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Daily Walk — Jesus-Centered Devotional App',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Daily Walk — A Jesus-Centered Devotional App',
    description: SITE_DESCRIPTION,
    images: ['/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: 'ReligionApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Daily Bible devotionals',
    'Prayer journal with answered prayer tracking',
    'Bible reading plans with progress tracking',
    'Reflection journal with mood tracking',
    'Bible search and verse lookup',
    'Gratitude wall',
    'Spiritual growth tracker',
    'Offline support',
  ],
  screenshot: '/store/screenshots/01-devotional.png',
  softwareVersion: '1.0.0',
  author: {
    '@type': 'Organization',
    name: 'Daily Walk',
    url: SITE_URL,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <SyncProvider>
          <AppProvider>
            <ToastProvider>
              <ServiceWorkerRegistrar />
              <OfflineIndicator />

              {children}
            </ToastProvider>
          </AppProvider>
        </SyncProvider>
      </body>
    </html>
  );
}
