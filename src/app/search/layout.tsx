import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bible Search — Find Verses & Passages',
  description: 'Search the Bible by keyword, topic, or reference. Find and share Scripture verses with a beautiful, easy-to-use Bible search tool.',
  alternates: { canonical: '/search' },
  openGraph: {
    title: 'Bible Search — Find Verses & Passages',
    description: 'Search the Bible by keyword, topic, or reference. Find and share Scripture verses.',
    url: '/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
