'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Plus, Eye, EyeOff, RotateCcw, Star, Award,
  BookOpen, Trash2, ArrowRight, Check, X
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { useApp } from '@/contexts/AppContext';
import { MemoryVerse } from '@/lib/types';
import { getStreakCount } from '@/lib/utils';

type PracticeMode = 'first-letter' | 'fill-blank' | 'full-recall';

const masteryColors = {
  Learning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  Familiar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  Memorized: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
};

function getFirstLetterHint(text: string): string {
  return text.replace(/\b(\w)(\w+)\b/g, (_, first) => first + '___');
}

function getFillInBlank(text: string): { display: string; blanks: string[] } {
  const words = text.split(' ');
  const blanks: string[] = [];
  const display = words.map((word, i) => {
    if (i > 0 && Math.random() < 0.3) {
      blanks.push(word);
      return '______';
    }
    return word;
  }).join(' ');
  return { display, blanks };
}

export default function MemoryPage() {
  const { memoryVerses, addMemoryVerse, updateMemoryVerse, deleteMemoryVerse, memoryPracticeDates } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [practiceVerse, setPracticeVerse] = useState<MemoryVerse | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('first-letter');
  const [showAnswer, setShowAnswer] = useState(false);
  const [recallText, setRecallText] = useState('');
  const [newReference, setNewReference] = useState('');
  const [newText, setNewText] = useState('');

  const streak = getStreakCount(memoryPracticeDates);

  // Priority review queue: learning > familiar > memorized, then oldest reviewed first
  const reviewQueue = useMemo(() => {
    const priority = { Learning: 0, Familiar: 1, Memorized: 2 };
    return [...memoryVerses].sort((a, b) => {
      const pDiff = priority[a.mastery] - priority[b.mastery];
      if (pDiff !== 0) return pDiff;
      return new Date(a.lastReviewed).getTime() - new Date(b.lastReviewed).getTime();
    });
  }, [memoryVerses]);

  const handleAddVerse = () => {
    if (!newReference.trim() || !newText.trim()) return;
    addMemoryVerse(newReference.trim(), newText.trim());
    setNewReference('');
    setNewText('');
    setShowAddModal(false);
  };

  const startPractice = (verse: MemoryVerse, mode: PracticeMode) => {
    setPracticeVerse(verse);
    setPracticeMode(mode);
    setShowAnswer(false);
    setRecallText('');
  };

  const completePractice = (verse: MemoryVerse, success: boolean) => {
    const newCount = verse.practiceCount + 1;
    let newMastery = verse.mastery;
    if (success && newCount >= 10) newMastery = 'Memorized';
    else if (success && newCount >= 4) newMastery = 'Familiar';
    updateMemoryVerse(verse.id, {
      practiceCount: newCount,
      mastery: newMastery,
      lastReviewed: new Date().toISOString(),
    });
    setPracticeVerse(null);
  };

  const fillBlankData = useMemo(() => {
    if (!practiceVerse || practiceMode !== 'fill-blank') return null;
    return getFillInBlank(practiceVerse.text);
  }, [practiceVerse, practiceMode]);

  return (
    <AppLayout>
      <PageHeader
        title="Scripture Memory"
        subtitle="I have hidden your word in my heart — Psalm 119:11"
        icon={<Brain size={28} />}
        action={
          <div className="flex items-center gap-3">
            <StreakBadge count={streak} label="practice streak" />
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Verse
            </Button>
          </div>
        }
      />

      {/* Quick Start: Review Queue */}
      {reviewQueue.length > 0 && !practiceVerse && (
        <Card className="mb-6 bg-[var(--accent)]/5 border-[var(--accent)]/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-1">Daily Review</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {reviewQueue.length} verse{reviewQueue.length !== 1 ? 's' : ''} ready for review.
                Next: <span className="font-medium">{reviewQueue[0].reference}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => startPractice(reviewQueue[0], 'first-letter')}>
                First Letter
              </Button>
              <Button size="sm" variant="secondary" onClick={() => startPractice(reviewQueue[0], 'fill-blank')}>
                Fill Blank
              </Button>
              <Button size="sm" variant="secondary" onClick={() => startPractice(reviewQueue[0], 'full-recall')}>
                Full Recall
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Practice Mode */}
      <AnimatePresence>
        {practiceVerse && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-8"
          >
            <Card className="border-[var(--accent)]/30">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="accent">
                  {practiceMode === 'first-letter' ? 'First Letter Mode' :
                   practiceMode === 'fill-blank' ? 'Fill in the Blank' : 'Full Recall'}
                </Badge>
                <button
                  onClick={() => setPracticeVerse(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  aria-label="Close practice"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="font-heading text-lg font-semibold text-[var(--accent)] mb-4">{practiceVerse.reference}</h3>

              {practiceMode === 'first-letter' && (
                <div className="space-y-4">
                  <p className="font-scripture text-lg text-[var(--text-primary)] leading-relaxed">
                    {showAnswer ? practiceVerse.text : getFirstLetterHint(practiceVerse.text)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAnswer(!showAnswer)}
                    >
                      {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showAnswer ? 'Hide' : 'Reveal'}
                    </Button>
                    {showAnswer && (
                      <>
                        <Button size="sm" onClick={() => completePractice(practiceVerse, true)}>
                          <Check size={14} /> Got It
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => completePractice(practiceVerse, false)}>
                          Needs Practice
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {practiceMode === 'fill-blank' && fillBlankData && (
                <div className="space-y-4">
                  <p className="font-scripture text-lg text-[var(--text-primary)] leading-relaxed">
                    {showAnswer ? practiceVerse.text : fillBlankData.display}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAnswer(!showAnswer)}
                    >
                      {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showAnswer ? 'Hide' : 'Reveal'}
                    </Button>
                    {showAnswer && (
                      <>
                        <Button size="sm" onClick={() => completePractice(practiceVerse, true)}>
                          <Check size={14} /> Got It
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => completePractice(practiceVerse, false)}>
                          Needs Practice
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {practiceMode === 'full-recall' && (
                <div className="space-y-4">
                  {!showAnswer ? (
                    <>
                      <textarea
                        value={recallText}
                        onChange={(e) => setRecallText(e.target.value)}
                        placeholder="Type the verse from memory..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none font-scripture"
                        aria-label="Type the verse from memory"
                      />
                      <Button size="sm" onClick={() => setShowAnswer(true)}>
                        <Eye size={14} /> Reveal & Compare
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Your Answer</p>
                          <p className="text-sm text-[var(--text-primary)]">{recallText || '(empty)'}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--accent)]/5">
                          <p className="text-xs font-medium text-[var(--accent)] mb-2">Actual Verse</p>
                          <p className="text-sm text-[var(--text-primary)]">{practiceVerse.text}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => completePractice(practiceVerse, true)}>
                          <Check size={14} /> Got It
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => completePractice(practiceVerse, false)}>
                          Needs Practice
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verse Collection */}
      {memoryVerses.length === 0 ? (
        <EmptyState
          icon={<Brain size={48} />}
          title="No verses yet"
          description="Start building your Scripture memory collection."
          scripture={{
            text: 'I have hidden your word in my heart that I might not sin against you.',
            reference: 'Psalm 119:11',
          }}
          action={
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add First Verse
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">
            Your Verses ({memoryVerses.length})
          </h2>
          {memoryVerses.map((verse, i) => (
            <motion.div
              key={verse.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-heading font-semibold text-[var(--accent)]">{verse.reference}</h3>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${masteryColors[verse.mastery]}`}>
                    {verse.mastery}
                  </span>
                </div>
                <p className="font-scripture text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">{verse.text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">
                    Practiced {verse.practiceCount} time{verse.practiceCount !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startPractice(verse, 'first-letter')}>
                      Practice
                    </Button>
                    <button
                      onClick={() => deleteMemoryVerse(verse.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      aria-label="Delete verse"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Verse Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Memory Verse">
        <div className="space-y-4">
          <Input
            label="Reference"
            placeholder="e.g., John 3:16"
            value={newReference}
            onChange={(e) => setNewReference(e.target.value)}
          />
          <TextArea
            label="Full Text"
            placeholder="Type the verse text..."
            rows={4}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <Button onClick={handleAddVerse} className="w-full">
            Add to Collection
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
