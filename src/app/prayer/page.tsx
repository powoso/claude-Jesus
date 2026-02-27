'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookHeart, Plus, Search, Filter, Check, CheckCircle2,
  Calendar, X, Clock, MessageCircle, Pencil
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { PrayerCategory } from '@/lib/types';
import { formatShortDate, getStreakCount } from '@/lib/utils';

const categories: PrayerCategory[] = ['Gratitude', 'Intercession', 'Confession', 'Petition', 'Praise', 'Healing', 'Guidance'];

const categoryColors: Record<string, string> = {
  Gratitude: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  Intercession: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  Confession: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  Petition: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  Praise: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  Healing: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  Guidance: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
};

export default function PrayerPage() {
  const { prayers, addPrayer, updatePrayer, deletePrayer, prayerDates } = useApp();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState<string | null>(null);
  const [editingPrayer, setEditingPrayer] = useState<string | null>(null);
  const [view, setView] = useState<'active' | 'answered'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<PrayerCategory>('Petition');
  const [testimonyNotes, setTestimonyNotes] = useState('');

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<PrayerCategory>('Petition');

  const streak = getStreakCount(prayerDates);

  const filteredPrayers = useMemo(() => {
    return prayers.filter(p => {
      if (view === 'active' && p.isAnswered) return false;
      if (view === 'answered' && !p.isAnswered) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [prayers, view, filterCategory, searchQuery]);

  const handleAddPrayer = () => {
    if (!newTitle.trim()) return;
    addPrayer({
      title: newTitle.trim(),
      description: newDescription.trim(),
      date: new Date().toISOString(),
      category: newCategory,
    });
    setNewTitle('');
    setNewDescription('');
    setNewCategory('Petition');
    setShowAddModal(false);
    showToast('Prayer added');
  };

  const handleMarkAnswered = (id: string) => {
    updatePrayer(id, {
      isAnswered: true,
      answeredDate: new Date().toISOString(),
      testimonyNotes: testimonyNotes.trim(),
    });
    setTestimonyNotes('');
    setShowAnswerModal(null);
    showToast('Praise God! Prayer marked as answered');
  };

  const openEditModal = (prayer: typeof prayers[0]) => {
    setEditingPrayer(prayer.id);
    setEditTitle(prayer.title);
    setEditDescription(prayer.description);
    setEditCategory(prayer.category);
  };

  const handleEditPrayer = () => {
    if (!editingPrayer || !editTitle.trim()) return;
    updatePrayer(editingPrayer, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
    });
    setEditingPrayer(null);
    showToast('Prayer updated');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Prayer Journal"
        subtitle="Cast all your anxiety on Him because He cares for you."
        icon={<BookHeart size={28} />}
        action={
          <div className="flex items-center gap-3">
            <StreakBadge count={streak} />
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              New Prayer
            </Button>
          </div>
        }
      />

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setView('active')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === 'active'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          Active Prayers
        </button>
        <button
          onClick={() => setView('answered')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === 'answered'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          Answered Prayers
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search prayers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            aria-label="Search prayers"
          />
        </div>
        <Select
          options={[{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))]}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="sm:w-48"
          aria-label="Filter by category"
        />
      </div>

      {/* Prayers List */}
      {filteredPrayers.length === 0 ? (
        <EmptyState
          icon={<BookHeart size={48} />}
          title={view === 'active' ? 'No active prayers yet' : 'No answered prayers yet'}
          description={view === 'active' ? 'Start your prayer journey by adding your first prayer request.' : 'When God answers, mark your prayers as answered to see them here.'}
          scripture={{
            text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
            reference: 'Philippians 4:6',
          }}
          action={view === 'active' ? (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add First Prayer
            </Button>
          ) : undefined}
        />
      ) : view === 'answered' ? (
        /* Answered Prayers Timeline */
        <div className="relative">
          <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-[var(--border-color)]" />
          <div className="space-y-6">
            {filteredPrayers.map((prayer, i) => (
              <motion.div
                key={prayer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative pl-10 sm:pl-16"
              >
                <div className="absolute left-2.5 sm:left-6.5 top-3 w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-[var(--bg-primary)]" />
                <Card>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-heading font-semibold text-[var(--text-primary)]">{prayer.title}</h3>
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">{prayer.description}</p>
                  {prayer.testimonyNotes && (
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-[var(--accent)] mb-1">Testimony</p>
                      <p className="text-sm text-[var(--text-secondary)]">{prayer.testimonyNotes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><Calendar size={12} /> Prayed: {formatShortDate(prayer.date)}</span>
                    <span className="flex items-center gap-1"><Check size={12} /> Answered: {prayer.answeredDate ? formatShortDate(prayer.answeredDate) : 'N/A'}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Active Prayers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrayers.map((prayer, i) => (
            <motion.div
              key={prayer.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-heading font-semibold text-[var(--text-primary)]">{prayer.title}</h3>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[prayer.category]}`}>
                    {prayer.category}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-3">{prayer.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Clock size={12} /> {formatShortDate(prayer.date)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(prayer)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      aria-label="Edit prayer"
                    >
                      <Pencil size={14} />
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAnswerModal(prayer.id);
                        setTestimonyNotes('');
                      }}
                    >
                      <CheckCircle2 size={14} />
                      Answered
                    </Button>
                    <button
                      onClick={() => { deletePrayer(prayer.id); showToast('Prayer removed'); }}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      aria-label="Delete prayer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Prayer Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Prayer Request">
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="What would you like to pray about?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <TextArea
            label="Description"
            placeholder="Pour out your heart..."
            rows={4}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <Select
            label="Category"
            options={categories.map(c => ({ value: c, label: c }))}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as PrayerCategory)}
          />
          <Button onClick={handleAddPrayer} className="w-full">
            Add Prayer
          </Button>
        </div>
      </Modal>

      {/* Edit Prayer Modal */}
      <Modal isOpen={!!editingPrayer} onClose={() => setEditingPrayer(null)} title="Edit Prayer">
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Prayer title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <TextArea
            label="Description"
            placeholder="Prayer details..."
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <Select
            label="Category"
            options={categories.map(c => ({ value: c, label: c }))}
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as PrayerCategory)}
          />
          <Button onClick={handleEditPrayer} className="w-full">
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* Mark Answered Modal */}
      <Modal isOpen={!!showAnswerModal} onClose={() => setShowAnswerModal(null)} title="Prayer Answered!">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Praise God! How did He answer this prayer?
          </p>
          <TextArea
            label="Testimony Notes (optional)"
            placeholder="Share how God answered this prayer..."
            rows={4}
            value={testimonyNotes}
            onChange={(e) => setTestimonyNotes(e.target.value)}
          />
          <Button onClick={() => showAnswerModal && handleMarkAnswered(showAnswerModal)} className="w-full" variant="gold">
            <CheckCircle2 size={16} />
            Mark as Answered
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
