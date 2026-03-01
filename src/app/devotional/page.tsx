'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Share2, Home,
  BookOpen, Flame, BookHeart, Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { CalendarPicker } from '@/components/ui/CalendarPicker';
import { dailyVerses, devotionalReflections } from '@/data/verses';
import { getDayOfYear, formatDate, copyToClipboard, getStreakCount } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function DevotionalPage() {
  const { prayerDates, readingProgress, visitDates, recordVisit } = useApp();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const d = t.devotional;
  const today = new Date();
  const [dayOffset, setDayOffset] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const currentDate = useMemo(() => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + dayOffset);
    return dt;
  }, [dayOffset]);

  const dayOfYear = getDayOfYear(currentDate);
  const verseIndex = ((dayOfYear - 1) % dailyVerses.length + dailyVerses.length) % dailyVerses.length;
  const verse = dailyVerses[verseIndex];
  const questions = devotionalReflections[verse.theme] || devotionalReflections['Faith'];
  const handleShare = async () => {
    const text = `"${verse.text}" — ${verse.reference}\n\n${d.shareText}`;
    await copyToClipboard(text);
    showToast(d.verseCopied);
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
    { icon: <BookHeart size={16} />, label: d.prayer, count: prayerStreak },
    { icon: <BookOpen size={16} />, label: d.reading, count: readingStreak },
  ];

  return (
    <AppLayout>
      <PageHeader
        title={d.title}
        subtitle={d.subtitle}
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
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{d.streakTitle}</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {walkStreak === 0 ? d.streakStart : walkStreak === 1 ? d.streakOne : d.streakMany.replace('{count}', String(walkStreak))}
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
          onClick={() => setDayOffset(prev => prev - 1)}
          aria-label={d.previousDay}
        >
          <ChevronLeft size={18} />
          {t.common.previous}
        </Button>

        <button
          onClick={() => setCalendarOpen(true)}
          className="text-center group cursor-pointer"
          aria-label={d.openCalendar}
        >
          <div className="flex items-center gap-1.5 justify-center">
            <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              {formatDate(currentDate)}
            </p>
            <Calendar size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
          </div>
          {!isToday && (
            <span
              onClick={(e) => { e.stopPropagation(); setDayOffset(0); }}
              className="text-xs text-[var(--accent)] hover:underline mt-0.5 inline-block"
            >
              {d.returnToday}
            </span>
          )}
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDayOffset(prev => prev + 1)}
          disabled={isToday}
          aria-label={d.nextDay}
        >
          {t.common.next}
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
                aria-label={d.copyVerse}
              >
                <Share2 size={16} />
                {d.shareVerse}
              </Button>
            </div>
          </Card>

          {/* Reflection Card */}
          <Card>
            <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-5">
              {d.reflectTitle}
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
              &ldquo;{d.footerVerse}&rdquo;
              <span className="block mt-1 not-italic text-xs">{d.footerRef}</span>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <CalendarPicker
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={currentDate}
        maxDate={today}
        onSelectDate={(date) => {
          const diffTime = date.getTime() - today.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          setDayOffset(diffDays);
        }}
      />
    </AppLayout>
  );
}
