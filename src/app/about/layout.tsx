import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Daily Walk',
  description: 'Learn about Daily Walk, a free Jesus-centered devotional app built to help you grow closer to God through daily Scripture, prayer, and reflection.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Daily Walk',
    description: 'A free Jesus-centered devotional app built to help you grow closer to God through daily Scripture, prayer, and reflection.',
    url: '/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
