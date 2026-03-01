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
  CheckCircle2,
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { copyToClipboard } from '@/lib/utils';
import {
  bibleBooks,
  OT_CATEGORIES,
  NT_CATEGORIES,
  getBookByName,
  getBookNumber,
  getNextChapter,
  getPrevChapter,
} from '@/data/bible-structure';

type BibleApi = 'bible-api' | 'bolls';

const TRANSLATIONS: { value: string; label: string; short: string; api: BibleApi }[] = [
  // bolls.life translations (includes popular copyrighted versions)
  { value: 'NIV', label: 'New International Version', short: 'NIV', api: 'bolls' },
  { value: 'ESV', label: 'English Standard Version', short: 'ESV', api: 'bolls' },
  { value: 'NKJV', label: 'New King James Version', short: 'NKJV', api: 'bolls' },
  { value: 'NLT', label: 'New Living Translation', short: 'NLT', api: 'bolls' },
  { value: 'NASB', label: 'New American Standard Bible', short: 'NASB', api: 'bolls' },
  // bible-api.com translations (public domain)
  { value: 'web', label: 'World English Bible', short: 'WEB', api: 'bible-api' },
  { value: 'kjv', label: 'King James Version', short: 'KJV', api: 'bible-api' },
  { value: 'bbe', label: 'Bible in Basic English', short: 'BBE', api: 'bible-api' },
  { value: 'oeb-us', label: 'Open English Bible', short: 'OEB', api: 'bible-api' },
  { value: 'clementine', label: 'Latin Vulgate', short: 'Vulgate', api: 'bible-api' },
  { value: 'almeida', label: 'Almeida (Portuguese)', short: 'Almeida', api: 'bible-api' },
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

// Bump this version to invalidate all cached entries (e.g. after fixing HTML stripping)
const CACHE_VERSION = 2;

function getCacheKey(book: string, chapter: number, translation: string): string {
  return `dw-bible-v${CACHE_VERSION}-${translation}-${book}-${chapter}`;
}

/** Strip HTML tags and section headings from bolls.life verse text */
function stripHtml(html: string): string {
  return html
    // Remove section headings (h1-h6) and their content entirely
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, '')
    // Remove USFM heading elements: any tag with class containing s, s1, s2, r, d, ms, mr, mt, qa, qc
    .replace(/<[a-z]+[^>]*\bclass="[^"]*\b(?:s\d*|r|d|ms\d*|mr|mt\d*|qa|qc|heading|title)\b[^"]*"[^>]*>[\s\S]*?<\/[a-z]+>/gi, '')
    // Replace line breaks with space
    .replace(/<br\s*\/?>/gi, ' ')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

function getLastRead(): LastRead {
  if (typeof window === 'undefined') return { book: 'Genesis', chapter: 1, translation: 'NIV' };
  try {
    const saved = localStorage.getItem('dw-bible-last-read');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { book: 'Genesis', chapter: 1, translation: 'NIV' };
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

const TOTAL_CHAPTERS = 1189;

function getChapterKey(book: string, chapter: number): string {
  return `${book}-${chapter}`;
}

export default function BiblePage() {
  const { showToast } = useToast();
  const { bibleChaptersRead, toggleChapterRead } = useApp();
  const { t } = useTranslation();
  const b = t.bible;
  const contentRef = useRef<HTMLDivElement>(null);
  const chaptersReadSet = new Set(bibleChaptersRead);

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
        const parsed = JSON.parse(cached);
        // Invalidate old cache entries that contain HTML tags
        const hasHtml = parsed.verses?.some((v: VerseData) => /<[^>]+>/.test(v.text));
        if (!hasHtml) {
          setChapterData(parsed);
          setError(null);
          return;
        }
        localStorage.removeItem(cacheKey);
      }
    } catch { /* ignore */ }

    setLoading(true);
    setError(null);

    try {
      const translationDef = TRANSLATIONS.find(t => t.value === trans);
      let chapterResult: ChapterData;

      if (translationDef?.api === 'bolls') {
        // Use bolls.life API for NIV, ESV, NASB, NLT, NKJV
        const bookNum = getBookNumber(book);
        const url = `https://bolls.life/get-text/${trans}/${bookNum}/${chapter}/`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Chapter not found');
        const data: { verse: number; text: string }[] = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('No verses found');

        chapterResult = {
          reference: `${book} ${chapter}`,
          verses: data.map(v => ({
            book_id: '',
            book_name: book,
            chapter,
            verse: v.verse,
            text: stripHtml(v.text),
          })),
          text: data.map(v => stripHtml(v.text)).join(' '),
          translation_id: trans,
          translation_name: translationDef.label,
        };
      } else {
        // Use bible-api.com for public domain translations
        const ref = `${book} ${chapter}`;
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${trans}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Chapter not found');
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        chapterResult = {
          reference: data.reference,
          verses: data.verses || [],
          text: data.text?.trim() || '',
          translation_id: trans,
          translation_name: TRANSLATIONS.find(t => t.value === trans)?.label || trans,
        };
      }

      // Cache in localStorage
      try {
        localStorage.setItem(cacheKey, JSON.stringify(chapterResult));
      } catch { /* storage full - ignore */ }

      setChapterData(chapterResult);
    } catch {
      setError(b.loadError);
      setChapterData(null);
    } finally {
      setLoading(false);
    }
  }, [b.loadError]);

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
      showToast(updated.includes(key) ? b.bookmarkAdded : b.bookmarkRemoved, 'success');
      return updated;
    });
  }, [selectedBook, selectedChapter, showToast, b.bookmarkAdded, b.bookmarkRemoved]);

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
    showToast(b.chapterCopied, 'success');
  }, [chapterData, showToast, b.chapterCopied]);

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
        title={b.title}
        subtitle={b.subtitle}
        icon={<Library size={28} />}
      />

      {/* Reading Progress */}
      {bibleChaptersRead.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{b.readingProgress}</span>
            <span className="text-xs font-bold text-[var(--accent)]">
              {b.chaptersProgress.replace('{read}', String(bibleChaptersRead.length)).replace('{total}', String(TOTAL_CHAPTERS)).replace('{percent}', String(Math.round((bibleChaptersRead.length / TOTAL_CHAPTERS) * 100)))}
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${(bibleChaptersRead.length / TOTAL_CHAPTERS) * 100}%` }}
            />
          </div>
        </Card>
      )}

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
            {t.common.chapter + ' ' + selectedChapter}
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
          <Button variant="ghost" size="sm" onClick={toggleBookmark} title={isBookmarked ? b.removeBookmark : b.bookmarkChapter}>
            <Bookmark size={14} className={isBookmarked ? 'fill-[var(--accent-gold)] text-[var(--accent-gold)]' : ''} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setShowBookmarks(!showBookmarks); setShowBookPicker(false); setShowChapterPicker(false); }} title={b.viewBookmarks}>
            <Library size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyChapter} title={b.copyChapter} disabled={!chapterData}>
            <Copy size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} title={b.share} disabled={!chapterData}>
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
                <h3 className="font-heading text-sm font-semibold text-[var(--text-primary)]">{b.bookmarks}</h3>
                <button onClick={() => setShowBookmarks(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>
              {bookmarks.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">{b.noBookmarks}</p>
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
                <h3 className="font-heading text-sm font-semibold text-[var(--text-primary)]">{b.selectBook}</h3>
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
                  {b.oldTestament}
                </button>
                <button
                  onClick={() => setPickerTestament('NT')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pickerTestament === 'NT'
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {b.newTestament}
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
                  {selectedBook + ' — ' + currentBook.chapters + ' ' + (currentBook.chapters !== 1 ? t.common.chapters : t.common.chapter)}
                </h3>
                <button onClick={() => setShowChapterPicker(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 max-h-64 overflow-y-auto">
                {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(ch => {
                  const isRead = chaptersReadSet.has(getChapterKey(selectedBook, ch));
                  return (
                    <button
                      key={ch}
                      onClick={() => selectChapter(ch)}
                      className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all border relative ${
                        ch === selectedChapter
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : isRead
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {ch}
                    </button>
                  );
                })}
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
            <p className="text-sm text-[var(--text-muted)]">{b.loadingChapter.replace('{book}', selectedBook).replace('{chapter}', String(selectedChapter))}</p>
          </div>
        )}

        {error && !loading && (
          <Card className="border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => fetchChapter(selectedBook, selectedChapter, translation)}>
              {t.common.tryAgain}
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

            {/* Mark as read */}
            {(() => {
              const key = getChapterKey(selectedBook, selectedChapter);
              const isRead = chaptersReadSet.has(key);
              return (
                <div className="flex justify-center mb-4">
                  <Button
                    variant={isRead ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      toggleChapterRead(key);
                      if (!isRead) showToast(b.markedAsRead.replace('{book}', selectedBook).replace('{chapter}', String(selectedChapter)), 'success');
                    }}
                  >
                    <CheckCircle2 size={14} />
                    {isRead ? b.read : b.markRead}
                  </Button>
                </div>
              );
            })()}

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
                  {prev ? `${prev.book} ${prev.chapter}` : t.common.start}
                </span>
                <span className="sm:hidden">{t.common.prev}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                title={b.scrollToTop}
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
                  {next ? `${next.book} ${next.chapter}` : t.common.end}
                </span>
                <span className="sm:hidden">{t.common.next}</span>
                <ChevronRight size={16} />
              </Button>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="accent">{currentBook?.testament === 'OT' ? b.oldTestament : b.newTestament}</Badge>
              <Badge variant="accent">{currentBook?.category}</Badge>
              <Badge variant="accent">{currentBook?.chapters + ' ' + t.common.chapters}</Badge>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
