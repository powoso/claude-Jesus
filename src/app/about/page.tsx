'use client';

import { motion } from 'framer-motion';
import { Cross, Heart, BookOpen, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <AppLayout>
      <PageHeader
        title="About Daily Walk"
        icon={
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Cross size={16} className="text-white" />
          </div>
        }
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-4">
              <Cross size={28} className="text-white" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">Daily Walk</h2>
            <p className="text-sm text-[var(--text-muted)]">Version 1.0.0</p>
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">Our Mission</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
            Daily Walk was created to provide a sacred, personal digital space where believers can deepen their
            relationship with Jesus Christ. In a world full of distractions, we believe everyone deserves a quiet
            place to meet with God — to read His Word, pour out their hearts in prayer, and track their spiritual
            growth journey.
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
            This app is built with the conviction that spiritual growth is a daily journey, not a destination.
            Every feature is designed to encourage, never condemn — to point you toward the grace and love of
            Jesus Christ.
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            No ads. No social media. No distractions. Just you and God.
          </p>
        </Card>

        <Card className="text-center py-8">
          <blockquote className="font-scripture text-lg text-[var(--text-primary)] leading-relaxed max-w-lg mx-auto mb-4">
            &ldquo;For God so loved the world that he gave his one and only Son, that whoever believes in him
            shall not perish but have eternal life.&rdquo;
          </blockquote>
          <p className="text-sm font-medium text-[var(--accent)]">— John 3:16</p>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">Features</h3>
          <ul className="space-y-3">
            {[
              { icon: '📖', text: 'Daily Devotionals with 365+ curated Bible verses' },
              { icon: '🙏', text: 'Prayer Journal with answered prayer timeline' },
              { icon: '📚', text: 'Bible Reading Plans with progress tracking' },
              { icon: '🧠', text: 'Scripture Memory Studio with practice modes' },
              { icon: '💛', text: 'Worship & Gratitude Wall' },
              { icon: '📈', text: 'Spiritual Growth Tracker with visual charts' },
            ].map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"
              >
                <span className="text-lg">{item.icon}</span>
                {item.text}
              </motion.li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">Privacy</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            All your data is stored locally on your device using browser localStorage. Nothing is sent to any
            server. Your prayers, reflections, and spiritual journey remain completely private between you and God.
            You can export your data anytime as a JSON backup from the Settings page.
          </p>
        </Card>

        <div className="text-center py-8">
          <p className="text-sm text-[var(--text-muted)] mb-2">Built with love for the glory of God</p>
          <Heart size={16} className="text-[var(--accent)] mx-auto mb-4" />
          <p className="font-scripture text-sm text-[var(--text-muted)]">
            &ldquo;Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.&rdquo;
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">— Colossians 3:23</p>
        </div>
      </div>
    </AppLayout>
  );
}
