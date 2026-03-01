'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  Search,
  Filter,

} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { copyToClipboard } from '@/lib/utils';
import { dailyVerses } from '@/data/verses';
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
const CACHE_VERSION = 5;

function getCacheKey(book: string, chapter: number, translation: string): string {
  return `dw-bible-v${CACHE_VERSION}-${translation}-${book}-${chapter}`;
}

/** Strip HTML tags and section headings from bolls.life verse text.
 *  bolls.life embeds section headings as HTML heading elements (e.g. <h3>The Beginning</h3>)
 *  or as plain text before a <br/> tag (e.g. "The Beginning<br/>In the beginning...")
 */
function stripHtml(html: string): string {
  // Remove HTML heading elements (h1-h6) and their content — these are section headings
  // e.g. <h3>The Beginning</h3> or <h4 class="s1">The Creation</h4>
  let cleaned = html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, '');

  // Remove plain-text section headings before <br/> tags (fallback for non-tagged headings).
  // These are short (under ~80 chars), have no sentence-ending punctuation,
  // and appear at the very start of the verse text.
  cleaned = cleaned.replace(/^([^<]{1,80})<br\s*\/?>/i, (match, heading) => {
    if (!/[.?!]$/.test(heading.trim())) {
      return '';
    }
    return match;
  });

  // Strip all remaining HTML tags
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
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

const SEARCH_TRANSLATIONS: { value: string; label: string }[] = [
  { value: 'web', label: 'WEB (World English Bible)' },
  { value: 'kjv', label: 'KJV (King James Version)' },
  { value: 'bbe', label: 'BBE (Bible in Basic English)' },
  { value: 'oeb-us', label: 'OEB (Open English Bible)' },
  { value: 'clementine', label: 'Clementine (Latin Vulgate)' },
  { value: 'almeida', label: 'Almeida (Portuguese)' },
];

const BIBLE_BOOKS_LIST = [
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

const verseThemes = Array.from(new Set(dailyVerses.map(v => v.theme)));

interface SearchApiVerse {
  reference: string;
  text: string;
  translation: string;
}

async function generateVerseCard(reference: string, text: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const w = 1080;
  const h = 1080;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#FFFDF7');
  grad.addColorStop(1, '#F5F0E8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  ctx.strokeStyle = '#E8E0D4';
  ctx.lineWidth = 1;
  ctx.strokeRect(56, 56, w - 112, h - 112);

  ctx.fillStyle = '#7C9070';
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u2720', w / 2, 130);

  ctx.fillStyle = '#7C9070';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(reference, w / 2, 190);

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

  const totalTextHeight = lines.length * lineHeight;
  const startY = Math.max(260, (h - totalTextHeight) / 2 + 20);

  ctx.fillStyle = '#C9A84C';
  ctx.font = '72px Georgia, serif';
  ctx.fillText('\u201C', 100, startY - 10);

  ctx.fillStyle = '#3D3328';
  ctx.font = 'italic 30px Georgia, serif';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], w / 2, startY + i * lineHeight);
  }

  ctx.fillStyle = '#C9A84C';
  ctx.font = '72px Georgia, serif';
  ctx.fillText('\u201D', w - 100, startY + (lines.length - 1) * lineHeight + 20);

  const dividerY = startY + lines.length * lineHeight + 40;
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 80, dividerY);
  ctx.lineTo(w / 2 + 80, dividerY);
  ctx.stroke();

  ctx.fillStyle = '#8B7B6B';
  ctx.font = '22px Georgia, serif';
  ctx.fillText('Daily Walk', w / 2, h - 80);
  ctx.font = '16px sans-serif';
  ctx.fillText('daily-walk.com', w / 2, h - 52);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
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

  // Mode: read or search
  const [mode, setMode] = useState<'read' | 'search'>('read');

  // Reader state
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

  // Search state
  const [searchTab, setSearchTab] = useState<'curated' | 'lookup'>('curated');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupBook, setLookupBook] = useState('');
  const [lookupChapter, setLookupChapter] = useState('');
  const [lookupVerse, setLookupVerse] = useState('');
  const [lookupTranslation, setLookupTranslation] = useState('web');
  const [lookupResult, setLookupResult] = useState<SearchApiVerse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

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

  // Search: curated results
  const curatedResults = useMemo(() => {
    let filtered = dailyVerses;
    if (selectedTheme) {
      filtered = filtered.filter(v => v.theme === selectedTheme);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.text.toLowerCase().includes(q) ||
        v.reference.toLowerCase().includes(q) ||
        v.theme.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [searchQuery, selectedTheme]);

  const showCuratedResults = hasSearched || searchQuery.trim() !== '' || selectedTheme !== null;

  // Search: build lookup ref
  const buildLookupRef = useCallback(() => {
    if (lookupBook) {
      let ref = lookupBook;
      if (lookupChapter) {
        ref += ` ${lookupChapter}`;
        if (lookupVerse) ref += `:${lookupVerse}`;
      }
      return ref;
    }
    return lookupQuery.trim();
  }, [lookupBook, lookupChapter, lookupVerse, lookupQuery]);

  // Search: lookup handler
  const handleLookup = useCallback(async () => {
    const ref = buildLookupRef();
    if (!ref) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${lookupTranslation}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Verse not found');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const label = SEARCH_TRANSLATIONS.find(t => t.value === lookupTranslation)?.label || lookupTranslation;
      setLookupResult({ reference: data.reference, text: data.text.trim(), translation: label });
    } catch {
      setLookupError('Could not find that verse. Try selecting a book and chapter, or type a reference like "John 3:16".');
    } finally {
      setLookupLoading(false);
    }
  }, [buildLookupRef, lookupTranslation]);

  // Search: copy/share verse
  const handleCopyVerse = useCallback(async (reference: string, text: string) => {
    await copyToClipboard(`"${text}" — ${reference}`);
    showToast('Verse copied to clipboard', 'success');
  }, [showToast]);

  const handleShareVerse = useCallback(async (reference: string, text: string) => {
    try {
      const blob = await generateVerseCard(reference, text);
      const file = new File([blob], `${reference.replace(/\s/g, '-')}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: reference, text: `"${text}" — ${reference}`, files: [file] });
        showToast('Shared!', 'success');
      } else {
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
  }, [showToast]);

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

      {/* Mode Tabs: Read / Search */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === 'read' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode('read')}
        >
          <BookOpen size={16} />
          Read
        </Button>
        <Button
          variant={mode === 'search' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode('search')}
        >
          <Search size={16} />
          Search
        </Button>
      </div>

      <AnimatePresence mode="wait">
      {mode === 'read' ? (
      <motion.div
        key="read"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }}
        transition={{ duration: 0.2 }}
      >

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

      </motion.div>
      ) : (
      <motion.div
        key="search"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.2 }}
      >
        {/* Search sub-tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={searchTab === 'curated' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSearchTab('curated')}
          >
            <BookOpen size={14} />
            Curated Verses
          </Button>
          <Button
            variant={searchTab === 'lookup' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSearchTab('lookup')}
          >
            <Search size={14} />
            Verse Lookup
          </Button>
        </div>

        {searchTab === 'curated' ? (
          <>
            {/* Curated search bar */}
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
                    onKeyDown={(e) => { if (e.key === 'Enter') setHasSearched(true); }}
                  />
                </div>
                <Button onClick={() => setHasSearched(true)} size="md">
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
                  {verseThemes.map(theme => (
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

            {/* Curated results */}
            {!showCuratedResults ? (
              <EmptyState
                icon={<BookOpen size={48} />}
                title="Search Scripture"
                description="Search through 365+ curated Bible verses by text, reference, or theme"
                scripture={{
                  text: "Your word is a lamp for my feet, a light on my path.",
                  reference: "Psalm 119:105",
                }}
              />
            ) : curatedResults.length === 0 ? (
              <EmptyState
                icon={<Search size={48} />}
                title="No verses found"
                description="Try a different search term or clear the theme filter"
              />
            ) : (
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {curatedResults.length} verse{curatedResults.length !== 1 ? 's' : ''} found
                  {selectedTheme && <> in <Badge variant="accent">{selectedTheme}</Badge></>}
                </p>
                <div className="space-y-3">
                  {curatedResults.map((verse, index) => (
                    <SearchVerseCard
                      key={verse.id}
                      reference={verse.reference}
                      text={verse.text}
                      theme={verse.theme}
                      index={index}
                      onCopy={handleCopyVerse}
                      onShare={handleShareVerse}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Verse lookup */}
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
                      value={lookupBook}
                      onChange={(e) => { setLookupBook(e.target.value); setLookupChapter(''); setLookupVerse(''); setLookupQuery(''); }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 text-sm appearance-none"
                    >
                      <option value="">Select book...</option>
                      {BIBLE_BOOKS_LIST.map(book => (
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
                    value={lookupChapter}
                    onChange={(e) => { setLookupChapter(e.target.value); setLookupQuery(''); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all duration-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">Verse(s)</label>
                  <input
                    type="text"
                    placeholder="e.g. 16 or 1-6"
                    value={lookupVerse}
                    onChange={(e) => { setLookupVerse(e.target.value); setLookupQuery(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
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
                    onChange={(e) => { setLookupQuery(e.target.value); setLookupBook(''); setLookupChapter(''); setLookupVerse(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
                  />
                </div>
              </div>

              {/* Translation picker + lookup button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">Translation</label>
                  <div className="relative">
                    <select
                      value={lookupTranslation}
                      onChange={(e) => setLookupTranslation(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-200 text-sm appearance-none"
                    >
                      {SEARCH_TRANSLATIONS.map(t => (
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
                <SearchVerseCard
                  reference={lookupResult.reference}
                  text={lookupResult.text}
                  index={0}
                  onCopy={handleCopyVerse}
                  onShare={handleShareVerse}
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
          </>
        )}
      </motion.div>
      )}
      </AnimatePresence>
    </AppLayout>
  );
}

function SearchVerseCard({
  reference,
  text,
  theme,
  index,
  onCopy,
  onShare,
}: {
  reference: string;
  text: string;
  theme?: string;
  index: number;
  onCopy: (ref: string, text: string) => void;
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
        </div>
      </div>
    </motion.div>
  );
}
