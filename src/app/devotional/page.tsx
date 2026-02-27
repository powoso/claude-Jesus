'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Share2, Check, Home } from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { dailyVerses, devotionalReflections } from '@/data/verses';
import { getDayOfYear, formatDate, copyToClipboard } from '@/lib/utils';

export default function DevotionalPage() {
  const today = new Date();
  const [dayOffset, setDayOffset] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const dayOfYear = getDayOfYear(currentDate);
  const verseIndex = ((dayOfYear - 1) % dailyVerses.length + dailyVerses.length) % dailyVerses.length;
  const verse = dailyVerses[verseIndex];
  const questions = devotionalReflections[verse.theme] || devotionalReflections['Faith'];

  const handleShare = async () => {
    const text = `"${verse.text}" — ${verse.reference}\n\nFrom Daily Walk Devotional`;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isToday = dayOffset === 0;

  return (
    <AppLayout>
      <PageHeader
        title="Daily Devotional"
        subtitle="Draw near to God, and He will draw near to you."
        icon={<Home size={28} />}
      />

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDayOffset(d => d - 1)}
          aria-label="Previous day"
        >
          <ChevronLeft size={18} />
          Previous
        </Button>

        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {formatDate(currentDate)}
          </p>
          {!isToday && (
            <button
              onClick={() => setDayOffset(0)}
              className="text-xs text-[var(--accent)] hover:underline mt-0.5"
            >
              Return to today
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDayOffset(d => d + 1)}
          disabled={isToday}
          aria-label="Next day"
        >
          Next
          <ChevronRight size={18} />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={dayOffset}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Theme Badge */}
          <div className="text-center">
            <span className="inline-block px-4 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              {verse.theme}
            </span>
          </div>

          {/* Verse Card */}
          <Card className="text-center py-10 px-8 sm:px-12">
            <blockquote className="font-scripture text-xl sm:text-2xl text-[var(--text-primary)] leading-relaxed mb-6">
              &ldquo;{verse.text}&rdquo;
            </blockquote>
            <p className="text-sm font-medium text-[var(--accent)]">{verse.reference}</p>

            <div className="mt-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                aria-label="Copy verse to clipboard"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? 'Copied!' : 'Share This Verse'}
              </Button>
            </div>
          </Card>

          {/* Reflection Card */}
          <Card>
            <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-5">
              Reflect & Respond
            </h2>
            <div className="space-y-4">
              {questions.map((question, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex gap-3"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xs font-semibold text-[var(--accent)]">
                    {i + 1}
                  </span>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed pt-0.5">
                    {question}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Encouragement */}
          <div className="text-center py-4">
            <p className="font-scripture text-sm text-[var(--text-muted)]">
              &ldquo;Your word is a lamp for my feet, a light on my path.&rdquo;
              <span className="block mt-1 not-italic text-xs">— Psalm 119:105</span>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}
