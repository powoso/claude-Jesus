'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Share2, Check, Home,
  BookOpen, Flame, BookHeart, PenLine, Save
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { dailyVerses, devotionalReflections } from '@/data/verses';
import { getDayOfYear, formatDate, copyToClipboard, getStreakCount, getDateKey } from '@/lib/utils';

export default function DevotionalPage() {
  const { prayerDates, readingProgress, saveJournalEntry, getJournalEntry, visitDates, recordVisit, isHydrated } = useApp();
  const { showToast } = useToast();
  const today = new Date();
  const [dayOffset, setDayOffset] = useState(0);

  const currentDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const dayOfYear = getDayOfYear(currentDate);
  const verseIndex = ((dayOfYear - 1) % dailyVerses.length + dailyVerses.length) % dailyVerses.length;
  const verse = dailyVerses[verseIndex];
  const questions = devotionalReflections[verse.theme] || devotionalReflections['Faith'];
  const dateKey = getDateKey(currentDate);

  // Journal state
  const existingEntry = getJournalEntry(dateKey);
  const [journalText, setJournalText] = useState(existingEntry?.text || '');
  const [journalDirty, setJournalDirty] = useState(false);

  // Sync journal text when navigating days
  useEffect(() => {
    const entry = getJournalEntry(dateKey);
    setJournalText(entry?.text || '');
    setJournalDirty(false);
  }, [dateKey, getJournalEntry]);

  const handleShare = async () => {
    const text = `"${verse.text}" — ${verse.reference}\n\nFrom Daily Walk Devotional`;
    await copyToClipboard(text);
    showToast('Verse copied to clipboard!');
  };

  const handleSaveJournal = () => {
    if (!journalText.trim()) return;
    saveJournalEntry(dateKey, journalText.trim(), verse.id);
    setJournalDirty(false);
    showToast('Journal entry saved');
  };

  // Record today's visit
  useEffect(() => {
    recordVisit();
  }, [recordVisit]);

  // Streak calculations
  const walkStreak = getStreakCount(visitDates);
  const prayerStreak = getStreakCount(prayerDates);
  const readingStreak = useMemo(() => {
    const allDates: string[] = [];
    readingProgress.forEach(p => {
      p.completedDays.forEach(() => {
        allDates.push(p.startDate);
      });
    });
    return allDates.length > 0 ? Math.min(getStreakCount(allDates), 99) : 0;
  }, [readingProgress]);

  const isToday = dayOffset === 0;
  const isMilestone = walkStreak > 0 && (walkStreak % 7 === 0 || walkStreak === 1);

  const streaks = [
    { icon: <BookHeart size={16} />, label: 'Prayer', count: prayerStreak },
    { icon: <BookOpen size={16} />, label: 'Reading', count: readingStreak },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Daily Devotional"
        subtitle="Draw near to God, and He will draw near to you."
        icon={<Home size={28} />}
      />

      {/* Daily Streak Dashboard */}
      {isToday && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-[var(--accent)]/5 border-[var(--accent)]/20">
            {/* Main Walk Streak */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={isMilestone ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: isMilestone ? Infinity : 0, duration: 1.5 }}
                >
                  <Flame size={20} className="text-amber-500" />
                </motion.div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Daily Walk Streak</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {walkStreak === 0 ? 'Start your streak today!' : walkStreak === 1 ? 'Great start! Come back tomorrow.' : `${walkStreak} days in a row!`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.span
                  key={walkStreak}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-[var(--accent)]"
                >
                  {walkStreak}
                </motion.span>
                <Flame size={14} className="text-amber-500" />
              </div>
            </div>

            {/* Activity Streaks */}
            <div className="grid grid-cols-2 gap-3">
              {streaks.map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl bg-[var(--bg-card)]">
                  <div className="flex items-center justify-center gap-1.5 text-[var(--accent)] mb-1">
                    {s.icon}
                    <span className="text-xl font-bold">{s.count}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

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
                <Share2 size={16} />
                Share This Verse
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

          {/* Personal Journal */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <PenLine size={18} className="text-[var(--accent)]" />
              <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                My Journal
              </h2>
              {isHydrated && existingEntry && !journalDirty && (
                <span className="text-xs text-[var(--text-muted)] ml-auto">Saved</span>
              )}
            </div>
            <textarea
              value={journalText}
              onChange={(e) => { setJournalText(e.target.value); setJournalDirty(true); }}
              placeholder="Write your thoughts, prayers, and reflections on today's verse..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none font-scripture text-sm leading-relaxed"
              aria-label="Journal entry"
            />
            {journalDirty && journalText.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex justify-end"
              >
                <Button size="sm" onClick={handleSaveJournal}>
                  <Save size={14} />
                  Save Entry
                </Button>
              </motion.div>
            )}
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
