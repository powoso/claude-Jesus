'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Copy, Plus, Filter, X, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { dailyVerses } from '@/data/verses';
import { copyToClipboard } from '@/lib/utils';
import { BibleVerse } from '@/lib/types';

const themes = Array.from(new Set(dailyVerses.map(v => v.theme)));

interface ApiVerse {
  reference: string;
  text: string;
}

export default function BibleSearchPage() {
  const { addMemoryVerse, memoryVerses } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'curated' | 'lookup'>('curated');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<ApiVerse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Search curated verses
  const results = useMemo(() => {
    let filtered = dailyVerses;

    if (selectedTheme) {
      filtered = filtered.filter(v => v.theme === selectedTheme);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.text.toLowerCase().includes(query) ||
        v.reference.toLowerCase().includes(query) ||
        v.theme.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedTheme]);

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Look up any verse via free API
  const handleLookup = useCallback(async () => {
    if (!lookupQuery.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(lookupQuery.trim())}`);
      if (!res.ok) throw new Error('Verse not found');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLookupResult({
        reference: data.reference,
        text: data.text.trim(),
      });
    } catch {
      setLookupError('Could not find that verse. Try a format like "John 3:16" or "Psalm 23:1-6".');
    } finally {
      setLookupLoading(false);
    }
  }, [lookupQuery]);

  const handleLookupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  const handleCopy = async (reference: string, text: string) => {
    await copyToClipboard(`"${text}" — ${reference}`);
    showToast('Verse copied to clipboard', 'success');
  };

  const handleSaveToMemory = (reference: string, text: string) => {
    const alreadySaved = memoryVerses.some(
      v => v.reference.toLowerCase() === reference.toLowerCase()
    );
    if (alreadySaved) {
      showToast('Already in your memory verses', 'info');
      return;
    }
    addMemoryVerse(reference, text);
    showToast('Saved to Scripture Memory!', 'success');
  };

  const showResults = hasSearched || searchQuery.trim() !== '' || selectedTheme !== null;

  return (
    <AppLayout>
      <PageHeader
        title="Bible Search"
        subtitle="Search Scripture by text, reference, or theme"
        icon={<Search size={28} />}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'curated' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('curated')}
        >
          <BookOpen size={16} />
          Curated Verses
        </Button>
        <Button
          variant={activeTab === 'lookup' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('lookup')}
        >
          <Search size={16} />
          Verse Lookup
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'curated' ? (
          <motion.div
            key="curated"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search bar */}
            <Card className="mb-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search by text, reference, or theme..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!hasSearched && e.target.value.trim()) setHasSearched(true);
                    }}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <Button onClick={handleSearch} size="md">
                  <Search size={16} />
                  Search
                </Button>
              </div>

              {/* Theme filters */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Filter size={14} className="text-[var(--text-muted)]" />
                  <span className="text-xs font-medium text-[var(--text-muted)]">Filter by theme</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {themes.map(theme => (
                    <button
                      key={theme}
                      onClick={() => {
                        setSelectedTheme(selectedTheme === theme ? null : theme);
                        if (!hasSearched) setHasSearched(true);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                        selectedTheme === theme
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                  {selectedTheme && (
                    <button
                      onClick={() => setSelectedTheme(null)}
                      className="px-3 py-1 rounded-full text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-all"
                    >
                      <X size={12} className="inline mr-1" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Results */}
            {!showResults ? (
              <EmptyState
                icon={<BookOpen size={48} />}
                title="Search Scripture"
                description="Search through 365+ curated Bible verses by text, reference, or theme"
                scripture={{
                  text: "Your word is a lamp for my feet, a light on my path.",
                  reference: "Psalm 119:105",
                }}
              />
            ) : results.length === 0 ? (
              <EmptyState
                icon={<Search size={48} />}
                title="No verses found"
                description="Try a different search term or clear the theme filter"
              />
            ) : (
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {results.length} verse{results.length !== 1 ? 's' : ''} found
                  {selectedTheme && <> in <Badge variant="accent">{selectedTheme}</Badge></>}
                </p>
                <div className="space-y-3">
                  {results.map((verse, index) => (
                    <VerseCard
                      key={verse.id}
                      reference={verse.reference}
                      text={verse.text}
                      theme={verse.theme}
                      index={index}
                      onCopy={handleCopy}
                      onSave={handleSaveToMemory}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="lookup"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Verse lookup */}
            <Card className="mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-3">
                Look up any Bible verse by reference. Try &ldquo;John 3:16&rdquo;, &ldquo;Psalm 23&rdquo;, or &ldquo;Romans 8:28-30&rdquo;.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="e.g. John 3:16, Psalm 23:1-6"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    onKeyDown={handleLookupKeyDown}
                  />
                </div>
                <Button onClick={handleLookup} size="md" disabled={lookupLoading}>
                  {lookupLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Look Up
                </Button>
              </div>
            </Card>

            {lookupLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
              </div>
            )}

            {lookupError && (
              <Card className="border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{lookupError}</p>
              </Card>
            )}

            {lookupResult && !lookupLoading && (
              <VerseCard
                reference={lookupResult.reference}
                text={lookupResult.text}
                index={0}
                onCopy={handleCopy}
                onSave={handleSaveToMemory}
              />
            )}

            {!lookupResult && !lookupLoading && !lookupError && (
              <EmptyState
                icon={<BookOpen size={48} />}
                title="Verse Lookup"
                description="Enter a Bible reference to look up any verse from the World English Bible translation"
                scripture={{
                  text: "Seek and you will find; knock and the door will be opened to you.",
                  reference: "Matthew 7:7",
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function VerseCard({
  reference,
  text,
  theme,
  index,
  onCopy,
  onSave,
}: {
  reference: string;
  text: string;
  theme?: string;
  index: number;
  onCopy: (ref: string, text: string) => void;
  onSave: (ref: string, text: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--accent)] mb-2">
            {reference}
          </p>
          <p className="font-scripture text-[var(--text-primary)] leading-relaxed mb-3">
            &ldquo;{text}&rdquo;
          </p>
          {theme && <Badge variant="accent">{theme}</Badge>}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(reference, text)}
            title="Copy verse"
          >
            <Copy size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave(reference, text)}
            title="Save to memory"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
