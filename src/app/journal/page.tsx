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
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { dailyVerses } from '@/data/verses';
import { formatShortDate, getDateKey } from '@/lib/utils';
import { JournalEntry, JournalMood } from '@/lib/types';

const MOODS: { value: JournalMood; emoji: string; label: string }[] = [
  { value: 'joyful', emoji: '😊', label: 'Joyful' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'peaceful', emoji: '☮️', label: 'Peaceful' },
  { value: 'hopeful', emoji: '🌅', label: 'Hopeful' },
  { value: 'reflective', emoji: '💭', label: 'Reflective' },
  { value: 'struggling', emoji: '💪', label: 'Struggling' },
  { value: 'seeking', emoji: '🔍', label: 'Seeking' },
];

function getMoodDisplay(mood?: JournalMood) {
  if (!mood) return null;
  return MOODS.find(m => m.value === mood) || null;
}

function getVerseById(id: number) {
  return dailyVerses.find(v => v.id === id);
}

function dateKeyToDate(dateKey: string): Date | null {
  const [year, dayOfYear] = dateKey.split('-').map(Number);
  if (!year || !dayOfYear) return null;
  const date = new Date(year, 0);
  date.setDate(dayOfYear);
  return date;
}

export default function JournalPage() {
  const { journalEntries, saveJournalEntry, getJournalEntry } = useApp();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editMood, setEditMood] = useState<JournalMood | undefined>(undefined);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newText, setNewText] = useState('');
  const [newMood, setNewMood] = useState<JournalMood | undefined>(undefined);

  const todayKey = getDateKey();
  const todayEntry = getJournalEntry(todayKey);

  const sortedEntries = useMemo(() => {
    let entries = [...journalEntries].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(e => {
        const verse = getVerseById(e.verseId);
        const moodDisplay = getMoodDisplay(e.mood);
        return (
          e.text.toLowerCase().includes(q) ||
          verse?.reference.toLowerCase().includes(q) ||
          verse?.text.toLowerCase().includes(q) ||
          moodDisplay?.label.toLowerCase().includes(q)
        );
      });
    }
    return entries;
  }, [journalEntries, searchQuery]);

  // Group entries by month
  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: JournalEntry[] }[] = [];
    const monthMap = new Map<string, JournalEntry[]>();

    for (const entry of sortedEntries) {
      const date = new Date(entry.updatedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!monthMap.has(key)) {
        monthMap.set(key, []);
        groups.push({ label, entries: monthMap.get(key)! });
      }
      monthMap.get(key)!.push(entry);
    }

    return groups;
  }, [sortedEntries]);

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditText(entry.text);
    setEditMood(entry.mood);
    setExpandedId(entry.id);
  };

  const handleSaveEdit = (entry: JournalEntry) => {
    if (!editText.trim()) return;
    saveJournalEntry(entry.dateKey, editText.trim(), entry.verseId, editMood);
    setEditingId(null);
    showToast('Journal entry updated');
  };

  const handleDeleteEntry = (entry: JournalEntry) => {
    saveJournalEntry(entry.dateKey, '', entry.verseId);
    showToast('Journal entry removed');
  };

  const handleNewEntry = () => {
    if (!newText.trim()) return;
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const verseIndex = ((dayOfYear - 1) % dailyVerses.length + dailyVerses.length) % dailyVerses.length;
    const verse = dailyVerses[verseIndex];
    saveJournalEntry(todayKey, newText.trim(), verse.id, newMood);
    setNewText('');
    setNewMood(undefined);
    setShowNewEntry(false);
    showToast('Journal entry saved');
  };

  const totalEntries = journalEntries.filter(e => e.text.trim()).length;

  return (
    <AppLayout>
      <PageHeader
        title="Journal"
        subtitle="Pour out your heart before Him — He is a refuge for us."
        icon={<PenLine size={28} />}
        action={
          <div className="flex items-center gap-3">
            {totalEntries > 0 && (
              <span className="text-sm text-[var(--text-muted)]">
                {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
              </span>
            )}
            <Button onClick={() => setShowNewEntry(true)}>
              <Plus size={16} />
              New Entry
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
                    {todayEntry ? 'Update Today\'s Entry' : 'Today\'s Reflection'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowNewEntry(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              {(() => {
                const today = new Date();
                const dayOfYear = Math.floor(
                  (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
                );
                const verseIndex = ((dayOfYear - 1) % dailyVerses.length + dailyVerses.length) % dailyVerses.length;
                const verse = dailyVerses[verseIndex];
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
              <MoodPicker selected={newMood} onSelect={setNewMood} />

              <textarea
                value={newText || todayEntry?.text || ''}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="What is God speaking to your heart today?"
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none font-scripture text-sm leading-relaxed"
                aria-label="New journal entry"
                autoFocus
              />
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={handleNewEntry}>
                  <Save size={14} />
                  Save Entry
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      {totalEntries > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label="Search journal entries"
            />
          </div>
        </div>
      )}

      {/* Entries */}
      {sortedEntries.filter(e => e.text.trim()).length === 0 ? (
        <EmptyState
          icon={<PenLine size={48} />}
          title="Your journal awaits"
          description="Start capturing your thoughts, prayers, and reflections. Write from the devotional page or tap 'New Entry' above."
          scripture={{
            text: 'Search me, God, and know my heart; test me and know my anxious thoughts.',
            reference: 'Psalm 139:23',
          }}
          action={
            !showNewEntry ? (
              <Button onClick={() => setShowNewEntry(true)}>
                <Plus size={16} />
                Write Your First Entry
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
                    const moodDisplay = getMoodDisplay(entry.mood);

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
                                {moodDisplay ? (
                                  <span className="text-base" title={moodDisplay.label}>{moodDisplay.emoji}</span>
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
                                {moodDisplay && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                                    {moodDisplay.emoji} {moodDisplay.label}
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
                                      <MoodPicker selected={editMood} onSelect={setEditMood} />
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
                                          Cancel
                                        </Button>
                                        <Button size="sm" onClick={() => handleSaveEdit(entry)}>
                                          <Save size={14} />
                                          Save
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
                                          {entry.updatedAt !== entry.createdAt ? 'Edited ' : ''}
                                          {formatShortDate(entry.updatedAt)}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStartEdit(entry)}
                                          >
                                            <PenLine size={14} />
                                            Edit
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
            &ldquo;Search me, God, and know my heart; test me and know my anxious thoughts.&rdquo;
            <span className="block mt-1 not-italic text-xs">— Psalm 139:23</span>
          </p>
        </div>
      )}
    </AppLayout>
  );
}

function MoodPicker({ selected, onSelect }: { selected?: JournalMood; onSelect: (mood: JournalMood | undefined) => void }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-[var(--text-muted)] mb-2">How are you feeling?</p>
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
            {mood.label}
          </button>
        ))}
      </div>
    </div>
  );
}
