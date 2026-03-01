import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bible Search — Redirecting',
  alternates: { canonical: '/bible' },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
