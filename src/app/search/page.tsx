'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Copy, Plus, Filter, X, Loader2, Share2, Download, ChevronDown } from 'lucide-react';
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

const themes = Array.from(new Set(dailyVerses.map(v => v.theme)));

const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
  'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
];

const TRANSLATIONS: { value: string; label: string }[] = [
  { value: 'web', label: 'WEB (World English Bible)' },
  { value: 'kjv', label: 'KJV (King James Version)' },
  { value: 'bbe', label: 'BBE (Bible in Basic English)' },
  { value: 'oeb-us', label: 'OEB (Open English Bible)' },
  { value: 'clementine', label: 'Clementine (Latin Vulgate)' },
  { value: 'almeida', label: 'Almeida (Portuguese)' },
];

interface ApiVerse {
  reference: string;
  text: string;
  translation: string;
}

/** Generate a shareable verse card image using Canvas */
async function generateVerseCard(reference: string, text: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const w = 1080;
  const h = 1080;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#FFFDF7');
  grad.addColorStop(1, '#F5F0E8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Decorative border
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  // Inner subtle border
  ctx.strokeStyle = '#E8E0D4';
  ctx.lineWidth = 1;
  ctx.strokeRect(56, 56, w - 112, h - 112);

  // Cross icon at top
  ctx.fillStyle = '#7C9070';
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u2720', w / 2, 130);

  // Reference at top
  ctx.fillStyle = '#7C9070';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(reference, w / 2, 190);

  // Verse text — word wrap
  ctx.fillStyle = '#3D3328';
  ctx.font = 'italic 30px Georgia, serif';
  ctx.textAlign = 'center';

  const maxWidth = w - 160;
  const lineHeight = 46;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Center the text block vertically
  const totalTextHeight = lines.length * lineHeight;
  const startY = Math.max(260, (h - totalTextHeight) / 2 + 20);

  // Opening quote
  ctx.fillStyle = '#C9A84C';
  ctx.font = '72px Georgia, serif';
  ctx.fillText('\u201C', 100, startY - 10);

  ctx.fillStyle = '#3D3328';
  ctx.font = 'italic 30px Georgia, serif';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], w / 2, startY + i * lineHeight);
  }

  // Closing quote
  ctx.fillStyle = '#C9A84C';
  ctx.font = '72px Georgia, serif';
  ctx.fillText('\u201D', w - 100, startY + (lines.length - 1) * lineHeight + 20);

  // Gold divider line
  const dividerY = startY + lines.length * lineHeight + 40;
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 80, dividerY);
  ctx.lineTo(w / 2 + 80, dividerY);
  ctx.stroke();

  // App branding
  ctx.fillStyle = '#8B7B6B';
  ctx.font = '22px Georgia, serif';
  ctx.fillText('Daily Walk', w / 2, h - 80);
  ctx.font = '16px sans-serif';
  ctx.fillText('daily-walk.com', w / 2, h - 52);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export default function BibleSearchPage() {
  const { addMemoryVerse, memoryVerses } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'curated' | 'lookup'>('curated');

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [selectedTranslation, setSelectedTranslation] = useState('web');
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

  // Build the lookup query from dropdowns or free text
  const buildLookupRef = useCallback(() => {
    if (selectedBook) {
      let ref = selectedBook;
      if (chapter) {
        ref += ` ${chapter}`;
        if (verse) ref += `:${verse}`;
      }
      return ref;
    }
    return lookupQuery.trim();
  }, [selectedBook, chapter, verse, lookupQuery]);

  // Look up any verse via free API
  const handleLookup = useCallback(async () => {
    const ref = buildLookupRef();
    if (!ref) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${selectedTranslation}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Verse not found');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const translationLabel = TRANSLATIONS.find(t => t.value === selectedTranslation)?.label || selectedTranslation;
      setLookupResult({
        reference: data.reference,
        text: data.text.trim(),
        translation: translationLabel,
      });
    } catch {
      setLookupError('Could not find that verse. Try selecting a book and chapter, or type a reference like "John 3:16".');
    } finally {
      setLookupLoading(false);
    }
  }, [buildLookupRef, selectedTranslation]);

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

  const handleShare = async (reference: string, text: string) => {
    try {
      const blob = await generateVerseCard(reference, text);
      const file = new File([blob], `${reference.replace(/\s/g, '-')}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: reference,
          text: `"${text}" — ${reference}`,
          files: [file],
        });
        showToast('Shared!', 'success');
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reference.replace(/\s/g, '-')}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Verse card downloaded!', 'success');
      }
    } catch {
      showToast('Could not share verse', 'error');
    }
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
                      onShare={handleShare}
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
            {/* Verse lookup with dropdowns */}
            <Card className="mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Use the dropdowns to browse, or type a reference directly.
              </p>

              {/* Book / Chapter / Verse dropdowns */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">Book</label>
                  <div className="relative">
                    <select
                      value={selectedBook}
                      onChange={(e) => { setSelectedBook(e.target.value); setChapter(''); setVerse(''); setLookupQuery(''); }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 text-sm appearance-none"
                    >
                      <option value="">Select book...</option>
                      {BIBLE_BOOKS.map(book => (
                        <option key={book} value={book}>{book}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">Chapter</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    value={chapter}
                    onChange={(e) => { setChapter(e.target.value); setLookupQuery(''); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all duration-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">Verse(s)</label>
                  <input
                    type="text"
                    placeholder="e.g. 16 or 1-6"
                    value={verse}
                    onChange={(e) => { setVerse(e.target.value); setLookupQuery(''); }}
                    onKeyDown={handleLookupKeyDown}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[var(--border-color)]" />
                <span className="text-xs text-[var(--text-muted)]">or type directly</span>
                <div className="flex-1 h-px bg-[var(--border-color)]" />
              </div>

              {/* Free text input */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="e.g. John 3:16, Psalm 23:1-6"
                    value={lookupQuery}
                    onChange={(e) => { setLookupQuery(e.target.value); setSelectedBook(''); setChapter(''); setVerse(''); }}
                    onKeyDown={handleLookupKeyDown}
                  />
                </div>
              </div>

              {/* Translation picker + lookup button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">Translation</label>
                  <div className="relative">
                    <select
                      value={selectedTranslation}
                      onChange={(e) => setSelectedTranslation(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 text-sm appearance-none"
                    >
                      {TRANSLATIONS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleLookup} size="md" disabled={lookupLoading}>
                    {lookupLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Look Up
                  </Button>
                </div>
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
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="accent">{lookupResult.translation}</Badge>
                </div>
                <VerseCard
                  reference={lookupResult.reference}
                  text={lookupResult.text}
                  index={0}
                  onCopy={handleCopy}
                  onSave={handleSaveToMemory}
                  onShare={handleShare}
                />
              </div>
            )}

            {!lookupResult && !lookupLoading && !lookupError && (
              <EmptyState
                icon={<BookOpen size={48} />}
                title="Verse Lookup"
                description="Select a book, chapter, and verse above — or type a reference directly"
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
  onShare,
}: {
  reference: string;
  text: string;
  theme?: string;
  index: number;
  onCopy: (ref: string, text: string) => void;
  onSave: (ref: string, text: string) => void;
  onShare: (ref: string, text: string) => void;
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
            onClick={() => onShare(reference, text)}
            title="Share verse card"
          >
            <Share2 size={14} />
          </Button>
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
