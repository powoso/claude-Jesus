import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Journal — Track & Celebrate Answered Prayers',
  description: 'Pour out your heart in prayer, organize requests by category, and celebrate when God answers. Keep a faithful record of His goodness.',
  alternates: { canonical: '/prayer' },
  openGraph: {
    title: 'Prayer Journal — Track & Celebrate Answered Prayers',
    description: 'Pour out your heart in prayer, organize requests by category, and celebrate when God answers.',
    url: '/prayer',
  },
};

export default function PrayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
