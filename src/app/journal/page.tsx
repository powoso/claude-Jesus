'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenLine, Search, Calendar, Trash2, ChevronDown, ChevronUp,
  BookOpen, Save, Plus, X,
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarPicker } from '@/components/ui/CalendarPicker';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { dailyVerses } from '@/data/verses';
import { getDayOfYear, formatShortDate } from '@/lib/utils';
import { JournalEntry, JournalMood } from '@/lib/types';
import { useTranslation, getLocale } from '@/lib/i18n';

const MOODS: { value: JournalMood; emoji: string }[] = [
  { value: 'joyful', emoji: '😊' },
  { value: 'grateful', emoji: '🙏' },
  { value: 'peaceful', emoji: '☮️' },
  { value: 'hopeful', emoji: '🌅' },
  { value: 'reflective', emoji: '💭' },
  { value: 'struggling', emoji: '💪' },
  { value: 'seeking', emoji: '🔍' },
];

function getMoodEmoji(mood?: JournalMood) {
  if (!mood) return null;
  return MOODS.find(m => m.value === mood)?.emoji || null;
}

function getVerseById(id: number) {
  return dailyVerses.find(v => v.id === id);
}

function dateKeyToDate(dateKey: string): Date | null {
  const parts = dateKey.split('-').map(Number);
  const year = parts[0];
  const dayOfYear = parts[1];
  if (year == null || dayOfYear == null || isNaN(year) || isNaN(dayOfYear)) return null;
  return new Date(year, 0, dayOfYear);
}

function getTodaysVerse() {
  const today = new Date();
  const dayOfYear = getDayOfYear(today);
  const verseIndex = ((dayOfYear - 1) % dailyVerses.length + dailyVerses.length) % dailyVerses.length;
  return dailyVerses[verseIndex];
}

export default function JournalPage() {
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry, isHydrated } = useApp();
  const { showToast } = useToast();
  const { t, lang } = useTranslation();
  const j = t.journal;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editMood, setEditMood] = useState<JournalMood | undefined>(undefined);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newText, setNewText] = useState('');
  const [newMood, setNewMood] = useState<JournalMood | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  const moodLabels: Record<JournalMood, string> = {
    joyful: j.moodJoyful,
    grateful: j.moodGrateful,
    peaceful: j.moodPeaceful,
    hopeful: j.moodHopeful,
    reflective: j.moodReflective,
    struggling: j.moodStruggling,
    seeking: j.moodSeeking,
  };

  function getMoodLabel(mood?: JournalMood) {
    if (!mood) return null;
    return moodLabels[mood] || null;
  }

  const sortedEntries = useMemo(() => {
    let entries = [...journalEntries].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    if (filterDate) {
      entries = entries.filter(e => {
        const entryDate = new Date(e.updatedAt);
        return entryDate.getFullYear() === filterDate.getFullYear() &&
          entryDate.getMonth() === filterDate.getMonth() &&
          entryDate.getDate() === filterDate.getDate();
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(e => {
        const verse = getVerseById(e.verseId);
        const moodLabel = getMoodLabel(e.mood);
        return (
          e.text.toLowerCase().includes(q) ||
          verse?.reference.toLowerCase().includes(q) ||
          verse?.text.toLowerCase().includes(q) ||
          moodLabel?.toLowerCase().includes(q)
        );
      });
    }
    return entries;
  }, [journalEntries, searchQuery, filterDate, moodLabels]);

  // Group entries by month
  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: JournalEntry[] }[] = [];
    const monthMap = new Map<string, JournalEntry[]>();

    for (const entry of sortedEntries) {
      const date = new Date(entry.updatedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString(getLocale(lang), { year: 'numeric', month: 'long' });
      if (!monthMap.has(key)) {
        monthMap.set(key, []);
        groups.push({ label, entries: monthMap.get(key)! });
      }
      monthMap.get(key)!.push(entry);
    }

    return groups;
  }, [sortedEntries, lang]);

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditText(entry.text);
    setEditMood(entry.mood);
    setExpandedId(entry.id);
  };

  const handleSaveEdit = (entry: JournalEntry) => {
    if (!editText.trim()) return;
    updateJournalEntry(entry.id, editText.trim(), editMood);
    setEditingId(null);
    showToast(j.entryUpdated);
  };

  const handleDeleteEntry = (entry: JournalEntry) => {
    deleteJournalEntry(entry.id);
    setExpandedId(null);
    showToast(j.entryRemoved);
  };

  const handleNewEntry = () => {
    if (!newText.trim()) return;
    const verse = getTodaysVerse();
    addJournalEntry(newText.trim(), verse.id, newMood);
    setNewText('');
    setNewMood(undefined);
    setShowNewEntry(false);
    showToast(j.entrySaved);
  };

  const totalEntries = journalEntries.filter(e => e.text.trim()).length;

  // Show minimal loading state until localStorage data is hydrated
  if (!isHydrated) {
    return (
      <AppLayout>
        <PageHeader
          title={j.title}
          subtitle={j.subtitle}
          icon={<PenLine size={28} />}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-[var(--text-muted)]">{j.loadingJournal}</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title={j.title}
        subtitle={j.subtitle}
        icon={<PenLine size={28} />}
        action={
          <div className="flex items-center gap-3">
            {totalEntries > 0 && (
              <span className="text-sm text-[var(--text-muted)]">
                {totalEntries} {totalEntries === 1 ? t.common.entry : t.common.entries}
              </span>
            )}
            <Button onClick={() => {
              setNewText('');
              setNewMood(undefined);
              setShowNewEntry(true);
            }}>
              <Plus size={16} />
              {j.newEntry}
            </Button>
          </div>
        }
      />

      {/* New Entry Card */}
      <AnimatePresence>
        {showNewEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PenLine size={18} className="text-[var(--accent)]" />
                  <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                    {j.newReflection}
                  </h2>
                </div>
                <button
                  onClick={() => setShowNewEntry(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  aria-label={t.common.close}
                >
                  <X size={16} />
                </button>
              </div>
              {(() => {
                const verse = getTodaysVerse();
                return (
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-4">
                    <p className="font-scripture text-sm text-[var(--text-secondary)] leading-relaxed">
                      &ldquo;{verse.text}&rdquo;
                    </p>
                    <p className="text-xs font-medium text-[var(--accent)] mt-2">{verse.reference}</p>
                  </div>
                );
              })()}

              {/* Mood Picker */}
              <MoodPicker selected={newMood} onSelect={setNewMood} labels={j} />

              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder={j.whatIsSpeaking}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none font-scripture text-sm leading-relaxed"
                aria-label="New journal entry"
                autoFocus
              />
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={handleNewEntry}>
                  <Save size={14} />
                  {j.saveEntry}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Calendar Filter */}
      {totalEntries > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={j.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                aria-label={j.searchPlaceholder}
              />
            </div>
            <button
              onClick={() => setCalendarOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all ${
                filterDate
                  ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              aria-label={j.filterByDate}
            >
              <Calendar size={16} />
            </button>
          </div>
          {filterDate && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                {j.showingEntriesFrom.replace('{date}', filterDate.toLocaleDateString(getLocale(lang), { month: 'long', day: 'numeric', year: 'numeric' }))}
              </span>
              <button
                onClick={() => setFilterDate(null)}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                {t.common.showAll}
              </button>
            </div>
          )}
        </div>
      )}

      <CalendarPicker
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={filterDate || new Date()}
        onSelectDate={(date) => setFilterDate(date)}
      />

      {/* Entries */}
      {sortedEntries.filter(e => e.text.trim()).length === 0 ? (
        <EmptyState
          icon={<PenLine size={48} />}
          title={j.emptyTitle}
          description={j.emptyDesc}
          scripture={{
            text: j.emptyScripture,
            reference: j.emptyScriptureRef,
          }}
          action={
            !showNewEntry ? (
              <Button onClick={() => {
                setNewText('');
                setNewMood(undefined);
                setShowNewEntry(true);
              }}>
                <Plus size={16} />
                {j.writeFirst}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {groupedEntries.map(group => {
            const nonEmptyEntries = group.entries.filter(e => e.text.trim());
            if (nonEmptyEntries.length === 0) return null;

            return (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-1">
                  {group.label}
                </h3>
                <div className="space-y-3">
                  {nonEmptyEntries.map((entry, i) => {
                    const verse = getVerseById(entry.verseId);
                    const entryDate = dateKeyToDate(entry.dateKey);
                    const isExpanded = expandedId === entry.id;
                    const isEditing = editingId === entry.id;
                    const moodEmoji = getMoodEmoji(entry.mood);
                    const moodLabel = getMoodLabel(entry.mood);

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="!p-0 overflow-hidden">
                          {/* Header — always visible */}
                          <button
                            onClick={() => {
                              if (isEditing) return;
                              setExpandedId(isExpanded ? null : entry.id);
                            }}
                            className="w-full text-left px-5 py-4 flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                                {moodEmoji ? (
                                  <span className="text-base" title={moodLabel || undefined}>{moodEmoji}</span>
                                ) : (
                                  <Calendar size={14} className="text-[var(--accent)]" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                  {entryDate ? formatShortDate(entryDate) : entry.dateKey}
                                </span>
                                {verse && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                                    {verse.reference}
                                  </span>
                                )}
                                {moodEmoji && moodLabel && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                                    {moodEmoji} {moodLabel}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                {entry.text}
                              </p>
                            </div>
                            <div className="flex-shrink-0 mt-1 text-[var(--text-muted)]">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {/* Expanded content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-4 border-t border-[var(--border-color)]">
                                  {/* Verse context */}
                                  {verse && (
                                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mt-4 mb-4">
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <BookOpen size={12} className="text-[var(--accent)]" />
                                        <span className="text-xs font-medium text-[var(--accent)]">{verse.reference}</span>
                                      </div>
                                      <p className="font-scripture text-sm text-[var(--text-secondary)] leading-relaxed">
                                        &ldquo;{verse.text}&rdquo;
                                      </p>
                                    </div>
                                  )}

                                  {/* Journal text or edit form */}
                                  {isEditing ? (
                                    <div>
                                      <MoodPicker selected={editMood} onSelect={setEditMood} labels={j} />
                                      <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none font-scripture text-sm leading-relaxed"
                                        aria-label="Edit journal entry"
                                        autoFocus
                                      />
                                      <div className="mt-3 flex items-center gap-2 justify-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setEditingId(null)}
                                        >
                                          {t.common.cancel}
                                        </Button>
                                        <Button size="sm" onClick={() => handleSaveEdit(entry)}>
                                          <Save size={14} />
                                          {t.common.save}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="font-scripture text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap mt-4">
                                        {entry.text}
                                      </p>
                                      <div className="mt-4 flex items-center justify-between">
                                        <span className="text-xs text-[var(--text-muted)]">
                                          {entry.updatedAt !== entry.createdAt ? j.edited : ''}
                                          {formatShortDate(entry.updatedAt)}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStartEdit(entry)}
                                          >
                                            <PenLine size={14} />
                                            {t.common.edit}
                                          </Button>
                                          <button
                                            onClick={() => handleDeleteEntry(entry)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                            aria-label="Delete entry"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom encouragement */}
      {totalEntries > 0 && (
        <div className="text-center py-8">
          <p className="font-scripture text-sm text-[var(--text-muted)]">
            &ldquo;{j.footerVerse}&rdquo;
            <span className="block mt-1 not-italic text-xs">{j.footerRef}</span>
          </p>
        </div>
      )}
    </AppLayout>
  );
}

function MoodPicker({ selected, onSelect, labels }: { selected?: JournalMood; onSelect: (mood: JournalMood | undefined) => void; labels: typeof import('@/lib/i18n/en').default.journal }) {
  const moodLabels: Record<JournalMood, string> = {
    joyful: labels.moodJoyful,
    grateful: labels.moodGrateful,
    peaceful: labels.moodPeaceful,
    hopeful: labels.moodHopeful,
    reflective: labels.moodReflective,
    struggling: labels.moodStruggling,
    seeking: labels.moodSeeking,
  };

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-[var(--text-muted)] mb-2">{labels.howFeeling}</p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map(mood => (
          <button
            key={mood.value}
            type="button"
            onClick={() => onSelect(selected === mood.value ? undefined : mood.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
              selected === mood.value
                ? 'bg-[var(--accent)] text-white border-[var(--accent)] scale-105'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            <span>{mood.emoji}</span>
            {moodLabels[mood.value]}
          </button>
        ))}
      </div>
    </div>
  );
}
