'use client';

import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Lock, Eye, Database, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'February 28, 2026';

  const sections = [
    {
      icon: <Eye size={18} className="text-[var(--accent)]" />,
      title: 'Information We Collect',
      content:
        'Daily Walk does not collect, transmit, or store any personal information on external servers. All data you enter into the app — including devotional reflections, prayer entries, scripture memory progress, gratitude entries, and growth check-ins — is stored exclusively on your device using your browser\'s localStorage.',
    },
    {
      icon: <Lock size={18} className="text-[var(--accent)]" />,
      title: 'Data Storage & Privacy',
      content:
        'Your data never leaves your device. We have no servers, no databases, and no analytics tracking. We cannot access, view, or recover your data. Your prayers, reflections, and spiritual journey remain completely private — between you and God.',
    },
    {
      icon: <Database size={18} className="text-[var(--accent)]" />,
      title: 'Data Backup & Export',
      content:
        'Daily Walk provides a built-in export feature that allows you to download all your data as a JSON file. You can also import previously exported data to restore your information. This gives you full ownership and control over your data at all times.',
    },
    {
      icon: <Trash2 size={18} className="text-[var(--accent)]" />,
      title: 'Data Deletion',
      content:
        'Since all data is stored locally on your device, you can delete it at any time by clearing your browser\'s localStorage or uninstalling the app. We do not retain any copies of your data.',
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Privacy Policy"
        icon={
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
        }
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-4">
              <Shield size={28} className="text-white" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">
              Your Privacy Matters
            </h2>
            <p className="text-sm text-[var(--text-muted)]">Last updated: {lastUpdated}</p>
          </div>
        </Card>

        <Card>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Daily Walk is built on a simple principle:{' '}
            <strong className="text-[var(--text-primary)]">your spiritual life is between you and God</strong>.
            We designed this app with complete privacy at its core. We collect no data, run no analytics,
            and show no advertisements. Your devotional journey is sacred and private.
          </p>
        </Card>

        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-3">
                {section.icon}
                <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                  {section.title}
                </h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{section.content}</p>
            </Card>
          </motion.div>
        ))}

        <Card>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">
            Third-Party Services
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
            Daily Walk uses the following third-party services solely for app functionality:
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] mt-1">•</span>
              <span>
                <strong className="text-[var(--text-primary)]">Google Fonts</strong> — to load the Inter and Lora
                typefaces. Google may collect basic usage data as described in their privacy policy.
              </span>
            </li>
          </ul>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">
            Children&apos;s Privacy
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Daily Walk does not knowingly collect any personal information from children under 13. Since all data
            is stored locally on the device and we do not collect any information, there is no risk of unauthorized
            data collection from minors.
          </p>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">
            Changes to This Policy
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            If we ever update this privacy policy, changes will be reflected on this page with an updated date.
            Our core commitment to zero data collection will not change.
          </p>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">
            Contact
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            If you have any questions about this privacy policy, please reach out through our app store listing
            or GitHub repository.
          </p>
        </Card>

        <div className="text-center py-8">
          <p className="font-scripture text-sm text-[var(--text-muted)]">
            &ldquo;The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.
            He leads me beside still waters. He restores my soul.&rdquo;
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">— Psalm 23:1-3</p>
        </div>
      </div>
    </AppLayout>
  );
}
