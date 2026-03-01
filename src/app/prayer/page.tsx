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
import { CalendarPicker } from '@/components/ui/CalendarPicker';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { PrayerCategory } from '@/lib/types';
import { formatShortDate, getStreakCount } from '@/lib/utils';
import { useTranslation, getLocale } from '@/lib/i18n';

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
  const { t, lang } = useTranslation();
  const p = t.prayer;

  const categoryLabels: Record<string, string> = {
    Gratitude: p.catGratitude,
    Intercession: p.catIntercession,
    Confession: p.catConfession,
    Petition: p.catPetition,
    Praise: p.catPraise,
    Healing: p.catHealing,
    Guidance: p.catGuidance,
  };

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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  const streak = getStreakCount(prayerDates);

  const filteredPrayers = useMemo(() => {
    return prayers.filter(pr => {
      if (view === 'active' && pr.isAnswered) return false;
      if (view === 'answered' && !pr.isAnswered) return false;
      if (filterCategory !== 'all' && pr.category !== filterCategory) return false;
      if (filterDate) {
        const prayerDate = new Date(pr.date);
        if (prayerDate.getFullYear() !== filterDate.getFullYear() ||
          prayerDate.getMonth() !== filterDate.getMonth() ||
          prayerDate.getDate() !== filterDate.getDate()) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return pr.title.toLowerCase().includes(q) || pr.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [prayers, view, filterCategory, searchQuery, filterDate]);

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
    showToast(p.prayerAdded);
  };

  const handleMarkAnswered = (id: string) => {
    updatePrayer(id, {
      isAnswered: true,
      answeredDate: new Date().toISOString(),
      testimonyNotes: testimonyNotes.trim(),
    });
    setTestimonyNotes('');
    setShowAnswerModal(null);
    showToast(p.prayerMarkedAnswered);
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
    showToast(p.prayerUpdated);
  };

  return (
    <AppLayout>
      <PageHeader
        title={p.title}
        subtitle={p.subtitle}
        icon={<BookHeart size={28} />}
        action={
          <div className="flex items-center gap-3">
            <StreakBadge count={streak} />
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              {p.newPrayer}
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
          {p.activePrayers}
        </button>
        <button
          onClick={() => setView('answered')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === 'answered'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          {p.answeredPrayers}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={p.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label={p.searchPlaceholder}
            />
          </div>
          <button
            onClick={() => setCalendarOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all ${
              filterDate
                ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
                : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            aria-label={p.filterByDate}
          >
            <Calendar size={16} />
          </button>
        </div>
        <Select
          options={[{ value: 'all', label: t.common.allCategories }, ...categories.map(c => ({ value: c, label: categoryLabels[c] || c }))]}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="sm:w-48"
          aria-label={t.common.allCategories}
        />
      </div>
      {filterDate && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-[var(--text-muted)]">
            {p.showingPrayersFrom.replace('{date}', filterDate.toLocaleDateString(getLocale(lang), { month: 'long', day: 'numeric', year: 'numeric' }))}
          </span>
          <button
            onClick={() => setFilterDate(null)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            {t.common.showAll}
          </button>
        </div>
      )}
      {!filterDate && <div className="mb-6" />}

      <CalendarPicker
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={filterDate || new Date()}
        onSelectDate={(date) => setFilterDate(date)}
      />

      {/* Prayers List */}
      {filteredPrayers.length === 0 ? (
        <EmptyState
          icon={<BookHeart size={48} />}
          title={view === 'active' ? p.noActive : p.noAnswered}
          description={view === 'active' ? p.noActiveDesc : p.noAnsweredDesc}
          scripture={{
            text: p.emptyScripture,
            reference: p.emptyScriptureRef,
          }}
          action={view === 'active' ? (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              {p.addFirst}
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
                      <p className="text-xs font-medium text-[var(--accent)] mb-1">{p.testimony}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{prayer.testimonyNotes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {p.prayed} {formatShortDate(prayer.date)}</span>
                    <span className="flex items-center gap-1"><Check size={12} /> {p.answered} {prayer.answeredDate ? formatShortDate(prayer.answeredDate) : p.na}</span>
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
                    {categoryLabels[prayer.category] || prayer.category}
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
                      aria-label={t.common.edit}
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
                      {p.answered.replace(/[:：]$/, '')}
                    </Button>
                    <button
                      onClick={() => { deletePrayer(prayer.id); showToast(p.prayerRemoved); }}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      aria-label={t.common.delete}
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
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={p.newRequestTitle}>
        <div className="space-y-4">
          <Input
            label={t.common.title}
            placeholder={p.whatPrayAbout}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <TextArea
            label={t.common.description}
            placeholder={p.pourOutHeart}
            rows={4}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <Select
            label={t.common.category}
            options={categories.map(c => ({ value: c, label: categoryLabels[c] || c }))}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as PrayerCategory)}
          />
          <Button onClick={handleAddPrayer} className="w-full">
            {p.addPrayer}
          </Button>
        </div>
      </Modal>

      {/* Edit Prayer Modal */}
      <Modal isOpen={!!editingPrayer} onClose={() => setEditingPrayer(null)} title={p.editPrayer}>
        <div className="space-y-4">
          <Input
            label={t.common.title}
            placeholder={p.prayerTitle}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <TextArea
            label={t.common.description}
            placeholder={p.prayerDetails}
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <Select
            label={t.common.category}
            options={categories.map(c => ({ value: c, label: categoryLabels[c] || c }))}
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as PrayerCategory)}
          />
          <Button onClick={handleEditPrayer} className="w-full">
            {p.saveChanges}
          </Button>
        </div>
      </Modal>

      {/* Mark Answered Modal */}
      <Modal isOpen={!!showAnswerModal} onClose={() => setShowAnswerModal(null)} title={p.prayerAnswered}>
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {p.praiseGod}
          </p>
          <TextArea
            label={p.testimonyNotes}
            placeholder={p.shareTestimony}
            rows={4}
            value={testimonyNotes}
            onChange={(e) => setTestimonyNotes(e.target.value)}
          />
          <Button onClick={() => showAnswerModal && handleMarkAnswered(showAnswerModal)} className="w-full" variant="gold">
            <CheckCircle2 size={16} />
            {p.markAnswered}
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
