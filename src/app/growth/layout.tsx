import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Growth Tracker — Spiritual Progress & Insights',
  description: 'Track your spiritual growth with gentle check-ins and visual charts. Reflect on Bible reading, prayer life, and faith journey over time.',
  alternates: { canonical: '/growth' },
  openGraph: {
    title: 'Growth Tracker — Spiritual Progress & Insights',
    description: 'Track your spiritual growth with gentle check-ins and visual charts.',
    url: '/growth',
  },
};

export default function GrowthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
