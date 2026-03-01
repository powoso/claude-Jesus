import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bible Reader — Read & Study Scripture',
  description: 'Read the Bible by book and chapter with a clean, distraction-free interface. Navigate all 66 books and study God\'s Word at your own pace.',
  alternates: { canonical: '/bible' },
  openGraph: {
    title: 'Bible Reader — Read & Study Scripture',
    description: 'Read the Bible by book and chapter with a clean, distraction-free interface.',
    url: '/bible',
  },
};

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
