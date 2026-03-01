import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Devotional — Scripture & Reflection',
  description: 'Start each day with a curated Bible verse, devotional reflection, and guided questions to deepen your walk with Jesus.',
  alternates: { canonical: '/devotional' },
  openGraph: {
    title: 'Daily Devotional — Scripture & Reflection',
    description: 'Start each day with a curated Bible verse, devotional reflection, and guided questions to deepen your walk with Jesus.',
    url: '/devotional',
  },
};

export default function DevotionalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
