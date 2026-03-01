'use client';

import { motion } from 'framer-motion';
import { Heart, BookOpen, ArrowLeft, DollarSign, ExternalLink } from 'lucide-react';
import Image from 'next/image';
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
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/favicon.svg" alt="Daily Walk" width={32} height={32} className="w-full h-full" />
          </div>
        }
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl mb-4 overflow-hidden shadow-lg">
              <Image src="/favicon.svg" alt="Daily Walk" width={64} height={64} className="w-full h-full" />
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
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">Support This Ministry</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
            Daily Walk is free and always will be. If this app has blessed your walk with Christ and you&apos;d like
            to support its continued development, your generosity is deeply appreciated. Every gift helps keep
            this ministry running and ad-free.
          </p>
          <div className="space-y-3">
            <a
              href="https://www.paypal.me/PaulChung11111"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-[#0070BA]/10 border border-[#0070BA]/20 hover:bg-[#0070BA]/15 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#0070BA] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">PP</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">PayPal</p>
                <p className="text-xs text-[var(--text-muted)]">@PaulChung11111</p>
              </div>
              <ExternalLink size={16} className="text-[var(--text-muted)] group-hover:text-[#0070BA] transition-colors flex-shrink-0" />
            </a>
            <a
              href="https://cash.app/$PaulC111"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-[#00D632]/10 border border-[#00D632]/20 hover:bg-[#00D632]/15 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#00D632] flex items-center justify-center flex-shrink-0">
                <DollarSign size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Cash App</p>
                <p className="text-xs text-[var(--text-muted)]">$PaulC111</p>
              </div>
              <ExternalLink size={16} className="text-[var(--text-muted)] group-hover:text-[#00D632] transition-colors flex-shrink-0" />
            </a>
          </div>
          <p className="text-xs text-center text-[var(--text-muted)] mt-4 font-scripture">
            &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under
            compulsion, for God loves a cheerful giver.&rdquo; — 2 Corinthians 9:7
          </p>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">Privacy</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
            By default, all your data is stored locally on your device using browser localStorage. Your prayers,
            reflections, and spiritual journey remain completely private between you and God.
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
            If you choose to enable Cloud Sync, your data is securely transmitted to Google Firebase servers so
            you can access it across devices. Cloud Sync is entirely optional — you are never required to create
            an account or send data off your device.
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            You can export your data anytime as a JSON backup from the Settings page. For full details, see
            our{' '}
            <Link href="/privacy" className="text-[var(--accent)] underline underline-offset-2 hover:opacity-80">
              Privacy Policy
            </Link>.
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
