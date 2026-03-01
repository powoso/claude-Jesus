import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Daily Walk privacy policy. Your data stays on your device by default. No tracking, no ads, no accounts required.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy — Daily Walk',
    description: 'Your data stays on your device by default. No tracking, no ads, no accounts required.',
    url: '/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
