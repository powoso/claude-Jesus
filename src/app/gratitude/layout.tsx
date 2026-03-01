import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gratitude Wall — Praise & Thankfulness',
  description: 'Capture moments of praise and thankfulness. Build a beautiful wall of gratitude entries to remember God\'s blessings in your life.',
  alternates: { canonical: '/gratitude' },
  openGraph: {
    title: 'Gratitude Wall — Praise & Thankfulness',
    description: 'Capture moments of praise and thankfulness. Remember God\'s blessings in your life.',
    url: '/gratitude',
  },
};

export default function GratitudeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
