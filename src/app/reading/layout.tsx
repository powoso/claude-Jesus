import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bible Reading Plans — Journey Through Scripture',
  description: 'Follow structured Bible reading plans including Bible in a Year, Gospels in 30 Days, and more. Track your daily progress through God\'s Word.',
  alternates: { canonical: '/reading' },
  openGraph: {
    title: 'Bible Reading Plans — Journey Through Scripture',
    description: 'Follow structured Bible reading plans and track your daily progress through God\'s Word.',
    url: '/reading',
  },
};

export default function ReadingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
