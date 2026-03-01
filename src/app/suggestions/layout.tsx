import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suggestions & Contact',
  description: 'Share your ideas, feedback, or prayer requests with the Daily Walk team. We\'d love to hear how we can serve you better on your walk with Christ.',
  alternates: { canonical: '/suggestions' },
  openGraph: {
    title: 'Suggestions & Contact — Daily Walk',
    description: 'Share your ideas, feedback, or prayer requests with the Daily Walk team.',
    url: '/suggestions',
  },
};

export default function SuggestionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
