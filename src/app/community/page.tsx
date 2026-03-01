'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  HandHeart,
  Search,
  Filter,
  X,
  Trash2,
  Clock,
  UserCircle,
  EyeOff,
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { CommunityPrayer, PrayerCategory } from '@/lib/types';

const CATEGORIES: PrayerCategory[] = [
  'Gratitude', 'Intercession', 'Petition', 'Praise', 'Healing', 'Guidance', 'Confession',
];

const CATEGORY_COLORS: Record<PrayerCategory, string> = {
  Gratitude: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Intercession: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Confession: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Petition: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  Praise: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  Healing: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  Guidance: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

// Pre-seeded community prayers to give the wall life from day one
const SEEDED_PRAYERS: Omit<CommunityPrayer, 'id'>[] = [
  {
    name: 'Sarah M.',
    request: 'Please pray for my mother who is going through chemotherapy. She needs strength and comfort during this difficult time.',
    category: 'Healing',
    isAnonymous: false,
    prayedCount: 24,
    hasPrayed: false,
    createdAt: '2026-02-27T10:30:00Z',
    isSeeded: true,
  },
  {
    name: 'Anonymous',
    request: 'Praying for guidance on a major career decision. I want to follow God\'s will but the path is unclear.',
    category: 'Guidance',
    isAnonymous: true,
    prayedCount: 18,
    hasPrayed: false,
    createdAt: '2026-02-27T14:15:00Z',
    isSeeded: true,
  },
  {
    name: 'David K.',
    request: 'Thanking God for the birth of our healthy baby girl! We are so blessed and grateful.',
    category: 'Gratitude',
    isAnonymous: false,
    prayedCount: 31,
    hasPrayed: false,
    createdAt: '2026-02-26T09:00:00Z',
    isSeeded: true,
  },
  {
    name: 'Maria L.',
    request: 'Please lift up our church community as we begin our spring outreach program. May God use us to serve those in need.',
    category: 'Intercession',
    isAnonymous: false,
    prayedCount: 15,
    hasPrayed: false,
    createdAt: '2026-02-26T16:45:00Z',
    isSeeded: true,
  },
  {
    name: 'Anonymous',
    request: 'Struggling with anxiety and feeling distant from God. Please pray for peace and restored faith.',
    category: 'Petition',
    isAnonymous: true,
    prayedCount: 42,
    hasPrayed: false,
    createdAt: '2026-02-25T11:20:00Z',
    isSeeded: true,
  },
  {
    name: 'James W.',
    request: 'Praising God for answered prayer — my son just got accepted to college with a full scholarship!',
    category: 'Praise',
    isAnonymous: false,
    prayedCount: 27,
    hasPrayed: false,
    createdAt: '2026-02-25T08:10:00Z',
    isSeeded: true,
  },
  {
    name: 'Rachel T.',
    request: 'Please pray for my marriage. We are going through a rough patch and need God\'s healing and wisdom.',
    category: 'Healing',
    isAnonymous: false,
    prayedCount: 36,
    hasPrayed: false,
    createdAt: '2026-02-24T19:30:00Z',
    isSeeded: true,
  },
  {
    name: 'Anonymous',
    request: 'Seeking forgiveness and the courage to make things right with someone I hurt deeply.',
    category: 'Confession',
    isAnonymous: true,
    prayedCount: 20,
    hasPrayed: false,
    createdAt: '2026-02-24T07:45:00Z',
    isSeeded: true,
  },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

export default function CommunityPrayerWallPage() {
  const { communityPrayers, addCommunityPrayer, togglePrayedFor, deleteCommunityPrayer } = useApp();
  const { showToast } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory | null>(null);
  const [name, setName] = useState('');
  const [request, setRequest] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('Petition');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Combine seeded + user prayers, applying user's prayed state to seeded ones
  const allPrayers = useMemo(() => {
    // Build a map of user interactions with seeded prayers (by request text)
    const userPrayerMap = new Map<string, CommunityPrayer>();
    const userOriginals: CommunityPrayer[] = [];

    for (const p of communityPrayers) {
      if (p.isSeeded) {
        userPrayerMap.set(p.request, p);
      } else {
        userOriginals.push(p);
      }
    }

    // Merge seeded prayers with any user interactions
    const seeded: CommunityPrayer[] = SEEDED_PRAYERS.map((sp, i) => {
      const userVersion = userPrayerMap.get(sp.request);
      if (userVersion) return userVersion;
      return { ...sp, id: `seeded-${i}` };
    });

    return [...userOriginals, ...seeded];
  }, [communityPrayers]);

  // Filtered results
  const filteredPrayers = useMemo(() => {
    let result = allPrayers;

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.request.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
      );
    }

    // Sort by newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allPrayers, selectedCategory, searchQuery]);

  const handleSubmit = () => {
    if (!request.trim()) {
      showToast('Please enter a prayer request', 'error');
      return;
    }
    if (!isAnonymous && !name.trim()) {
      showToast('Please enter your name or post anonymously', 'error');
      return;
    }

    addCommunityPrayer({
      name: isAnonymous ? 'Anonymous' : name.trim(),
      request: request.trim(),
      category,
      isAnonymous,
    });

    showToast('Prayer request shared with the community!', 'success');
    setShowAddModal(false);
    setName('');
    setRequest('');
    setCategory('Petition');
    setIsAnonymous(false);
  };

  const handlePray = (prayer: CommunityPrayer) => {
    // For seeded prayers, we need to save them to local storage first
    if (prayer.id.startsWith('seeded-')) {
      // Save this seeded prayer to local storage with hasPrayed toggled
      const newPrayer: CommunityPrayer = {
        ...prayer,
        id: prayer.id,
        hasPrayed: true,
        prayedCount: prayer.prayedCount + 1,
        isSeeded: true,
      };
      // We need to add it directly — the AppContext will handle it
      addCommunityPrayer({
        name: prayer.name,
        request: prayer.request,
        category: prayer.category,
        isAnonymous: prayer.isAnonymous,
      });
      // Immediately toggle it
      const prayers = JSON.parse(localStorage.getItem('dw-community-prayers') || '[]');
      const last = prayers[0];
      if (last) {
        last.hasPrayed = true;
        last.prayedCount = prayer.prayedCount + 1;
        last.isSeeded = true;
        last.createdAt = prayer.createdAt;
        localStorage.setItem('dw-community-prayers', JSON.stringify(prayers));
      }
      showToast('Praying for this request', 'success');
      // Force re-render
      window.dispatchEvent(new Event('storage'));
      return;
    }

    togglePrayedFor(prayer.id);
    if (!prayer.hasPrayed) {
      showToast('Praying for this request', 'success');
    }
  };

  const totalPrayers = allPrayers.length;
  const totalPrayedFor = allPrayers.filter(p => p.hasPrayed).length;

  return (
    <AppLayout>
      <PageHeader
        title="Community Prayer Wall"
        subtitle="Bear one another's burdens and pray together"
        icon={<Users size={28} />}
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center !py-4">
          <p className="text-2xl font-bold text-[var(--accent)]">{totalPrayers}</p>
          <p className="text-xs text-[var(--text-muted)]">Prayer Requests</p>
        </Card>
        <Card className="text-center !py-4">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalPrayedFor}</p>
          <p className="text-xs text-[var(--text-muted)]">You Prayed For</p>
        </Card>
      </div>

      {/* Search + Add button */}
      <Card className="mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search prayer requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowAddModal(true)} size="md">
            <Plus size={16} />
            Share Prayer
          </Button>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 mb-2">
          <Filter size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs font-medium text-[var(--text-muted)]">Filter</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                selectedCategory === cat
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              {cat}
            </button>
          ))}
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-1 rounded-full text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-all"
            >
              <X size={12} className="inline mr-1" />
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Prayer list */}
      {filteredPrayers.length === 0 ? (
        <EmptyState
          icon={<HandHeart size={48} />}
          title="No prayer requests yet"
          description="Be the first to share a prayer request with the community"
          scripture={{
            text: "Bear one another's burdens, and so fulfill the law of Christ.",
            reference: 'Galatians 6:2',
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredPrayers.map((prayer, index) => (
            <motion.div
              key={prayer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
              className="card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Header: Name + time */}
                  <div className="flex items-center gap-2 mb-2">
                    {prayer.isAnonymous ? (
                      <EyeOff size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                    ) : (
                      <UserCircle size={16} className="text-[var(--accent)] flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {prayer.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock size={10} />
                      {timeAgo(prayer.createdAt)}
                    </span>
                  </div>

                  {/* Prayer text */}
                  <p className="text-[var(--text-primary)] leading-relaxed mb-3">
                    {prayer.request}
                  </p>

                  {/* Category + prayer count */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[prayer.category]}`}>
                      {prayer.category}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <HandHeart size={12} />
                      {prayer.prayedCount} praying
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    variant={prayer.hasPrayed ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handlePray(prayer)}
                    title={prayer.hasPrayed ? 'Prayed!' : 'Pray for this'}
                    className="!px-3"
                  >
                    <HandHeart size={14} />
                    <span className="text-xs">{prayer.hasPrayed ? 'Prayed' : 'Pray'}</span>
                  </Button>
                  {!prayer.isSeeded && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        deleteCommunityPrayer(prayer.id);
                        showToast('Prayer request removed', 'info');
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add prayer modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Share a Prayer Request"
      >
        <div className="space-y-4">
          {/* Anonymous toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                isAnonymous ? 'bg-[var(--accent)]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow ${
                  isAnonymous ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <EyeOff size={14} className="text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">Post anonymously</span>
            </div>
          </div>

          {/* Name (if not anonymous) */}
          {!isAnonymous && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Your name
              </label>
              <Input
                placeholder="First name or initials"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    category === cat
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Prayer request text */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Prayer request
            </label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Share what's on your heart..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
            >
              <Plus size={16} />
              Share Prayer
            </Button>
          </div>

          <p className="text-xs text-center text-[var(--text-muted)]">
            Your prayer request will be visible on the community wall.
          </p>
        </div>
      </Modal>
    </AppLayout>
  );
}
