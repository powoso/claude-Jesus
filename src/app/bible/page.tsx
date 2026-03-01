'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Share2,
  Loader2,
  Library,
  X,
  Bookmark,
  ArrowUp,
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { copyToClipboard } from '@/lib/utils';
import {
  bibleBooks,
  OT_CATEGORIES,
  NT_CATEGORIES,
  getBookByName,
  getNextChapter,
  getPrevChapter,
} from '@/data/bible-structure';

const TRANSLATIONS: { value: string; label: string; short: string }[] = [
  { value: 'web', label: 'World English Bible', short: 'WEB' },
  { value: 'kjv', label: 'King James Version', short: 'KJV' },
  { value: 'bbe', label: 'Bible in Basic English', short: 'BBE' },
  { value: 'oeb-us', label: 'Open English Bible', short: 'OEB' },
  { value: 'clementine', label: 'Latin Vulgate', short: 'Vulgate' },
  { value: 'almeida', label: 'Almeida (Portuguese)', short: 'Almeida' },
];

interface VerseData {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface ChapterData {
  reference: string;
  verses: VerseData[];
  text: string;
  translation_id: string;
  translation_name: string;
}

interface LastRead {
  book: string;
  chapter: number;
  translation: string;
}

function getCacheKey(book: string, chapter: number, translation: string): string {
  return `dw-bible-${translation}-${book}-${chapter}`;
}

function getLastRead(): LastRead {
  if (typeof window === 'undefined') return { book: 'Genesis', chapter: 1, translation: 'web' };
  try {
    const saved = localStorage.getItem('dw-bible-last-read');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { book: 'Genesis', chapter: 1, translation: 'web' };
}

function saveLastRead(lastRead: LastRead): void {
  try {
    localStorage.setItem('dw-bible-last-read', JSON.stringify(lastRead));
  } catch { /* ignore */ }
}

function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('dw-bible-bookmarks');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

function saveBookmarks(bookmarks: string[]): void {
  try {
    localStorage.setItem('dw-bible-bookmarks', JSON.stringify(bookmarks));
  } catch { /* ignore */ }
}

export default function BiblePage() {
  const { showToast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [translation, setTranslation] = useState('web');
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [pickerTestament, setPickerTestament] = useState<'OT' | 'NT'>('OT');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load last read position and bookmarks on mount
  useEffect(() => {
    const lastRead = getLastRead();
    setSelectedBook(lastRead.book);
    setSelectedChapter(lastRead.chapter);
    setTranslation(lastRead.translation);
    setBookmarks(getBookmarks());
    setInitialized(true);
  }, []);

  // Fetch chapter text
  const fetchChapter = useCallback(async (book: string, chapter: number, trans: string) => {
    const cacheKey = getCacheKey(book, chapter, trans);

    // Check cache first
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setChapterData(JSON.parse(cached));
        setError(null);
        return;
      }
    } catch { /* ignore */ }

    setLoading(true);
    setError(null);

    try {
      const ref = `${book} ${chapter}`;
      const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${trans}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Chapter not found');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const chapterResult: ChapterData = {
        reference: data.reference,
        verses: data.verses || [],
        text: data.text?.trim() || '',
        translation_id: trans,
        translation_name: TRANSLATIONS.find(t => t.value === trans)?.label || trans,
      };

      // Cache in localStorage
      try {
        localStorage.setItem(cacheKey, JSON.stringify(chapterResult));
      } catch { /* storage full - ignore */ }

      setChapterData(chapterResult);
    } catch {
      setError('Could not load this chapter. Please check your connection and try again.');
      setChapterData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load chapter when selection changes
  useEffect(() => {
    if (!initialized) return;
    fetchChapter(selectedBook, selectedChapter, translation);
    saveLastRead({ book: selectedBook, chapter: selectedChapter, translation });
  }, [selectedBook, selectedChapter, translation, fetchChapter, initialized]);

  // Navigation
  const goToNext = useCallback(() => {
    const next = getNextChapter(selectedBook, selectedChapter);
    if (next) {
      setSelectedBook(next.book);
      setSelectedChapter(next.chapter);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedBook, selectedChapter]);

  const goToPrev = useCallback(() => {
    const prev = getPrevChapter(selectedBook, selectedChapter);
    if (prev) {
      setSelectedBook(prev.book);
      setSelectedChapter(prev.chapter);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedBook, selectedChapter]);

  const selectBook = useCallback((bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
    setShowBookPicker(false);
    setShowChapterPicker(false);
  }, []);

  const selectChapter = useCallback((ch: number) => {
    setSelectedChapter(ch);
    setShowChapterPicker(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Bookmarks
  const bookmarkKey = `${selectedBook} ${selectedChapter}`;
  const isBookmarked = bookmarks.includes(bookmarkKey);

  const toggleBookmark = useCallback(() => {
    setBookmarks(prev => {
      const key = `${selectedBook} ${selectedChapter}`;
      const updated = prev.includes(key) ? prev.filter(b => b !== key) : [...prev, key];
      saveBookmarks(updated);
      showToast(updated.includes(key) ? 'Bookmark added' : 'Bookmark removed', 'success');
      return updated;
    });
  }, [selectedBook, selectedChapter, showToast]);

  const goToBookmark = useCallback((bm: string) => {
    const match = bm.match(/^(.+)\s(\d+)$/);
    if (match) {
      setSelectedBook(match[1]);
      setSelectedChapter(parseInt(match[2]));
      setShowBookmarks(false);
    }
  }, []);

  // Copy chapter
  const handleCopyChapter = useCallback(async () => {
    if (!chapterData) return;
    const text = chapterData.verses.length > 0
      ? chapterData.verses.map(v => `${v.verse}. ${v.text.trim()}`).join('\n')
      : chapterData.text;
    await copyToClipboard(`${chapterData.reference}\n\n${text}`);
    showToast('Chapter copied to clipboard', 'success');
  }, [chapterData, showToast]);

  // Share chapter
  const handleShare = useCallback(async () => {
    if (!chapterData) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: chapterData.reference,
          text: chapterData.text.slice(0, 500) + (chapterData.text.length > 500 ? '...' : ''),
        });
      } else {
        await handleCopyChapter();
      }
    } catch { /* user cancelled share */ }
  }, [chapterData, handleCopyChapter]);

  const currentBook = getBookByName(selectedBook);
  const prev = getPrevChapter(selectedBook, selectedChapter);
  const next = getNextChapter(selectedBook, selectedChapter);

  const categories = pickerTestament === 'OT' ? OT_CATEGORIES : NT_CATEGORIES;

  return (
    <AppLayout>
      <PageHeader
        title="The Bible"
        subtitle="Read God's Word — all 66 books, 1,189 chapters"
        icon={<Library size={28} />}
      />

      {/* Top Controls */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Book Picker Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setShowBookPicker(!showBookPicker); setShowChapterPicker(false); setShowBookmarks(false); }}
          >
            <BookOpen size={14} />
            {selectedBook}
            <ChevronDown size={12} />
          </Button>

          {/* Chapter Picker Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setShowChapterPicker(!showChapterPicker); setShowBookPicker(false); setShowBookmarks(false); }}
          >
            Chapter {selectedChapter}
            <ChevronDown size={12} />
          </Button>

          {/* Translation Picker */}
          <div className="relative">
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm appearance-none pr-7 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {TRANSLATIONS.map(t => (
                <option key={t.value} value={t.value}>{t.short}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <Button variant="ghost" size="sm" onClick={toggleBookmark} title={isBookmarked ? 'Remove bookmark' : 'Bookmark this chapter'}>
            <Bookmark size={14} className={isBookmarked ? 'fill-[var(--accent-gold)] text-[var(--accent-gold)]' : ''} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setShowBookmarks(!showBookmarks); setShowBookPicker(false); setShowChapterPicker(false); }} title="View bookmarks">
            <Library size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyChapter} title="Copy chapter" disabled={!chapterData}>
            <Copy size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} title="Share" disabled={!chapterData}>
            <Share2 size={14} />
          </Button>
        </div>
      </Card>

      {/* Bookmarks Panel */}
      <AnimatePresence>
        {showBookmarks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-sm font-semibold text-[var(--text-primary)]">Bookmarks</h3>
                <button onClick={() => setShowBookmarks(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>
              {bookmarks.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No bookmarks yet. Tap the bookmark icon to save your place.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {bookmarks.map(bm => (
                    <button
                      key={bm}
                      onClick={() => goToBookmark(bm)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        bm === bookmarkKey
                          ? 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border-[var(--accent-gold)]/30'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {bm}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Picker Panel */}
      <AnimatePresence>
        {showBookPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-sm font-semibold text-[var(--text-primary)]">Select a Book</h3>
                <button onClick={() => setShowBookPicker(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>

              {/* Testament Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setPickerTestament('OT')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pickerTestament === 'OT'
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  Old Testament
                </button>
                <button
                  onClick={() => setPickerTestament('NT')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pickerTestament === 'NT'
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  New Testament
                </button>
              </div>

              {/* Books by Category */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {categories.map(cat => (
                  <div key={cat}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {bibleBooks
                        .filter(b => b.testament === pickerTestament && b.category === cat)
                        .map(book => (
                          <button
                            key={book.name}
                            onClick={() => selectBook(book.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              book.name === selectedBook
                                ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                            }`}
                          >
                            {book.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Picker Panel */}
      <AnimatePresence>
        {showChapterPicker && currentBook && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-sm font-semibold text-[var(--text-primary)]">
                  {selectedBook} — {currentBook.chapters} chapter{currentBook.chapters !== 1 ? 's' : ''}
                </h3>
                <button onClick={() => setShowChapterPicker(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 max-h-64 overflow-y-auto">
                {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    onClick={() => selectChapter(ch)}
                    className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all border ${
                      ch === selectedChapter
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Content */}
      <div ref={contentRef}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
            <p className="text-sm text-[var(--text-muted)]">Loading {selectedBook} {selectedChapter}...</p>
          </div>
        )}

        {error && !loading && (
          <Card className="border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => fetchChapter(selectedBook, selectedChapter, translation)}>
              Try Again
            </Button>
          </Card>
        )}

        {chapterData && !loading && (
          <motion.div
            key={`${selectedBook}-${selectedChapter}-${translation}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Chapter Header */}
            <div className="mb-6 text-center">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                {chapterData.reference}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {TRANSLATIONS.find(t => t.value === translation)?.label}
              </p>
            </div>

            {/* Verses */}
            <Card className="mb-6">
              <div className="bible-text space-y-1">
                {chapterData.verses.length > 0 ? (
                  chapterData.verses.map((verse) => (
                    <p key={verse.verse} className="font-scripture text-[var(--text-primary)] leading-[1.9] text-[1.05rem]">
                      <sup className="text-[var(--accent)] font-bold text-[0.7rem] mr-1 select-none">{verse.verse}</sup>
                      {verse.text.trim()}{' '}
                    </p>
                  ))
                ) : (
                  <p className="font-scripture text-[var(--text-primary)] leading-[1.9] text-[1.05rem] whitespace-pre-line">
                    {chapterData.text}
                  </p>
                )}
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 mb-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={goToPrev}
                disabled={!prev}
                className={!prev ? 'opacity-40' : ''}
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">
                  {prev ? `${prev.book} ${prev.chapter}` : 'Start'}
                </span>
                <span className="sm:hidden">Prev</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                title="Scroll to top"
              >
                <ArrowUp size={14} />
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={goToNext}
                disabled={!next}
                className={!next ? 'opacity-40' : ''}
              >
                <span className="hidden sm:inline">
                  {next ? `${next.book} ${next.chapter}` : 'End'}
                </span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={16} />
              </Button>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="accent">{currentBook?.testament === 'OT' ? 'Old Testament' : 'New Testament'}</Badge>
              <Badge variant="accent">{currentBook?.category}</Badge>
              <Badge variant="accent">{currentBook?.chapters} chapters</Badge>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
