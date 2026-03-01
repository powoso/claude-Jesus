import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reflection Journal — Daily Spiritual Journaling',
  description: 'Write daily reflections paired with Scripture, track your mood, and build a meaningful record of your spiritual journey with Christ.',
  alternates: { canonical: '/journal' },
  openGraph: {
    title: 'Reflection Journal — Daily Spiritual Journaling',
    description: 'Write daily reflections paired with Scripture and track your spiritual journey with Christ.',
    url: '/journal',
  },
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
