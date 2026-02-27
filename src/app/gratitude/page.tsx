'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, Filter, Trash2, Calendar, BookOpen } from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/contexts/AppContext';
import { GratitudeEntry } from '@/lib/types';
import { formatShortDate } from '@/lib/utils';

const pastelClasses = ['pastel-rose', 'pastel-sky', 'pastel-emerald', 'pastel-amber', 'pastel-violet', 'pastel-pink'];
const categoryOptions: GratitudeEntry['category'][] = ['Gratitude', 'Praise', 'Worship'];

export default function GratitudePage() {
  const { gratitudeEntries, addGratitudeEntry, deleteGratitudeEntry } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newText, setNewText] = useState('');
  const [newScripture, setNewScripture] = useState('');
  const [newCategory, setNewCategory] = useState<GratitudeEntry['category']>('Gratitude');

  // "This time last year" feature
  const lastYearEntries = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const range = 3 * 86400000; // 3 days range
    return gratitudeEntries.filter(e => {
      const eDate = new Date(e.date);
      return Math.abs(eDate.getTime() - oneYearAgo.getTime()) < range;
    });
  }, [gratitudeEntries]);

  const months = useMemo(() => {
    const monthSet = new Set<string>();
    gratitudeEntries.forEach(e => {
      const d = new Date(e.date);
      monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(monthSet).sort().reverse();
  }, [gratitudeEntries]);

  const filteredEntries = useMemo(() => {
    return gratitudeEntries.filter(e => {
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (filterMonth !== 'all') {
        const d = new Date(e.date);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (m !== filterMonth) return false;
      }
      return true;
    });
  }, [gratitudeEntries, filterCategory, filterMonth]);

  const handleAdd = () => {
    if (!newText.trim()) return;
    addGratitudeEntry({
      text: newText.trim(),
      scriptureReference: newScripture.trim() || undefined,
      category: newCategory,
    });
    setNewText('');
    setNewScripture('');
    setNewCategory('Gratitude');
    setShowAddModal(false);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Gratitude Wall"
        subtitle="Give thanks to the Lord, for He is good."
        icon={<Heart size={28} />}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Entry
          </Button>
        }
      />

      {/* This Time Last Year */}
      {lastYearEntries.length > 0 && (
        <Card className="mb-6 bg-[var(--accent-gold)]/5 border-[var(--accent-gold)]/20">
          <h3 className="font-heading text-sm font-semibold text-[var(--accent-gold)] mb-2 flex items-center gap-2">
            <Calendar size={14} /> This Time Last Year
          </h3>
          {lastYearEntries.map(entry => (
            <p key={entry.id} className="text-sm text-[var(--text-secondary)] italic">
              &ldquo;{entry.text}&rdquo;
            </p>
          ))}
        </Card>
      )}

      {/* Filters */}
      {gratitudeEntries.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Select
            options={[
              { value: 'all', label: 'All Months' },
              ...months.map(m => {
                const [y, mon] = m.split('-');
                const date = new Date(parseInt(y), parseInt(mon) - 1);
                return { value: m, label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
              }),
            ]}
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="sm:w-48"
            aria-label="Filter by month"
          />
          <Select
            options={[{ value: 'all', label: 'All Categories' }, ...categoryOptions.map(c => ({ value: c, label: c }))]}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="sm:w-48"
            aria-label="Filter by category"
          />
        </div>
      )}

      {/* Masonry Grid */}
      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={<Heart size={48} />}
          title="Your gratitude wall is empty"
          description="Start capturing moments of praise and thankfulness."
          scripture={{
            text: 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.',
            reference: 'Psalm 100:4',
          }}
          action={
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add First Entry
            </Button>
          }
        />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {filteredEntries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="break-inside-avoid"
            >
              <div className={`${pastelClasses[i % pastelClasses.length]} rounded-2xl p-5 border border-[var(--border-color)] transition-all hover:shadow-md`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {formatShortDate(entry.date)}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-[var(--text-muted)]">
                      {entry.category}
                    </span>
                    <button
                      onClick={() => deleteGratitudeEntry(entry.id)}
                      className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 text-[var(--text-muted)]"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">{entry.text}</p>
                {entry.scriptureReference && (
                  <p className="font-scripture text-xs text-[var(--accent)] flex items-center gap-1">
                    <BookOpen size={12} /> {entry.scriptureReference}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Gratitude Entry">
        <div className="space-y-4">
          <TextArea
            label="What are you thankful for?"
            placeholder="Share your gratitude, praise, or worship reflection..."
            rows={4}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <Input
            label="Scripture Reference (optional)"
            placeholder="e.g., Psalm 136:1"
            value={newScripture}
            onChange={(e) => setNewScripture(e.target.value)}
          />
          <Select
            label="Category"
            options={categoryOptions.map(c => ({ value: c, label: c }))}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as GratitudeEntry['category'])}
          />
          <Button onClick={handleAdd} className="w-full" variant="gold">
            <Heart size={16} />
            Add to Wall
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
