export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'OT' | 'NT';
  category: string;
  abbreviation: string;
}

export const bibleBooks: BibleBook[] = [
  // ─── Old Testament ────────────────────────────────────────
  // Pentateuch (Law / Torah)
  { name: 'Genesis', chapters: 50, testament: 'OT', category: 'Pentateuch', abbreviation: 'Gen' },
  { name: 'Exodus', chapters: 40, testament: 'OT', category: 'Pentateuch', abbreviation: 'Exod' },
  { name: 'Leviticus', chapters: 27, testament: 'OT', category: 'Pentateuch', abbreviation: 'Lev' },
  { name: 'Numbers', chapters: 36, testament: 'OT', category: 'Pentateuch', abbreviation: 'Num' },
  { name: 'Deuteronomy', chapters: 34, testament: 'OT', category: 'Pentateuch', abbreviation: 'Deut' },

  // Historical Books
  { name: 'Joshua', chapters: 24, testament: 'OT', category: 'Historical', abbreviation: 'Josh' },
  { name: 'Judges', chapters: 21, testament: 'OT', category: 'Historical', abbreviation: 'Judg' },
  { name: 'Ruth', chapters: 4, testament: 'OT', category: 'Historical', abbreviation: 'Ruth' },
  { name: '1 Samuel', chapters: 31, testament: 'OT', category: 'Historical', abbreviation: '1Sam' },
  { name: '2 Samuel', chapters: 24, testament: 'OT', category: 'Historical', abbreviation: '2Sam' },
  { name: '1 Kings', chapters: 22, testament: 'OT', category: 'Historical', abbreviation: '1Kgs' },
  { name: '2 Kings', chapters: 25, testament: 'OT', category: 'Historical', abbreviation: '2Kgs' },
  { name: '1 Chronicles', chapters: 29, testament: 'OT', category: 'Historical', abbreviation: '1Chr' },
  { name: '2 Chronicles', chapters: 36, testament: 'OT', category: 'Historical', abbreviation: '2Chr' },
  { name: 'Ezra', chapters: 10, testament: 'OT', category: 'Historical', abbreviation: 'Ezra' },
  { name: 'Nehemiah', chapters: 13, testament: 'OT', category: 'Historical', abbreviation: 'Neh' },
  { name: 'Esther', chapters: 10, testament: 'OT', category: 'Historical', abbreviation: 'Esth' },

  // Wisdom / Poetry
  { name: 'Job', chapters: 42, testament: 'OT', category: 'Wisdom', abbreviation: 'Job' },
  { name: 'Psalms', chapters: 150, testament: 'OT', category: 'Wisdom', abbreviation: 'Ps' },
  { name: 'Proverbs', chapters: 31, testament: 'OT', category: 'Wisdom', abbreviation: 'Prov' },
  { name: 'Ecclesiastes', chapters: 12, testament: 'OT', category: 'Wisdom', abbreviation: 'Eccl' },
  { name: 'Song of Solomon', chapters: 8, testament: 'OT', category: 'Wisdom', abbreviation: 'Song' },

  // Major Prophets
  { name: 'Isaiah', chapters: 66, testament: 'OT', category: 'Major Prophets', abbreviation: 'Isa' },
  { name: 'Jeremiah', chapters: 52, testament: 'OT', category: 'Major Prophets', abbreviation: 'Jer' },
  { name: 'Lamentations', chapters: 5, testament: 'OT', category: 'Major Prophets', abbreviation: 'Lam' },
  { name: 'Ezekiel', chapters: 48, testament: 'OT', category: 'Major Prophets', abbreviation: 'Ezek' },
  { name: 'Daniel', chapters: 12, testament: 'OT', category: 'Major Prophets', abbreviation: 'Dan' },

  // Minor Prophets
  { name: 'Hosea', chapters: 14, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Hos' },
  { name: 'Joel', chapters: 3, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Joel' },
  { name: 'Amos', chapters: 9, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Amos' },
  { name: 'Obadiah', chapters: 1, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Obad' },
  { name: 'Jonah', chapters: 4, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Jonah' },
  { name: 'Micah', chapters: 7, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Mic' },
  { name: 'Nahum', chapters: 3, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Nah' },
  { name: 'Habakkuk', chapters: 3, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Hab' },
  { name: 'Zephaniah', chapters: 3, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Zeph' },
  { name: 'Haggai', chapters: 2, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Hag' },
  { name: 'Zechariah', chapters: 14, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Zech' },
  { name: 'Malachi', chapters: 4, testament: 'OT', category: 'Minor Prophets', abbreviation: 'Mal' },

  // ─── New Testament ────────────────────────────────────────
  // Gospels
  { name: 'Matthew', chapters: 28, testament: 'NT', category: 'Gospels', abbreviation: 'Matt' },
  { name: 'Mark', chapters: 16, testament: 'NT', category: 'Gospels', abbreviation: 'Mark' },
  { name: 'Luke', chapters: 24, testament: 'NT', category: 'Gospels', abbreviation: 'Luke' },
  { name: 'John', chapters: 21, testament: 'NT', category: 'Gospels', abbreviation: 'John' },

  // History
  { name: 'Acts', chapters: 28, testament: 'NT', category: 'History', abbreviation: 'Acts' },

  // Pauline Epistles
  { name: 'Romans', chapters: 16, testament: 'NT', category: 'Pauline Epistles', abbreviation: 'Rom' },
  { name: '1 Corinthians', chapters: 16, testament: 'NT', category: 'Pauline Epistles', abbreviation: '1Cor' },
  { name: '2 Corinthians', chapters: 13, testament: 'NT', category: 'Pauline Epistles', abbreviation: '2Cor' },
  { name: 'Galatians', chapters: 6, testament: 'NT', category: 'Pauline Epistles', abbreviation: 'Gal' },
  { name: 'Ephesians', chapters: 6, testament: 'NT', category: 'Pauline Epistles', abbreviation: 'Eph' },
  { name: 'Philippians', chapters: 4, testament: 'NT', category: 'Pauline Epistles', abbreviation: 'Phil' },
  { name: 'Colossians', chapters: 4, testament: 'NT', category: 'Pauline Epistles', abbreviation: 'Col' },
  { name: '1 Thessalonians', chapters: 5, testament: 'NT', category: 'Pauline Epistles', abbreviation: '1Thess' },
  { name: '2 Thessalonians', chapters: 3, testament: 'NT', category: 'Pauline Epistles', abbreviation: '2Thess' },
  { name: '1 Timothy', chapters: 6, testament: 'NT', category: 'Pauline Epistles', abbreviation: '1Tim' },
  { name: '2 Timothy', chapters: 4, testament: 'NT', category: 'Pauline Epistles', abbreviation: '2Tim' },
  { name: 'Titus', chapters: 3, testament: 'NT', category: 'Pauline Epistles', abbreviation: 'Titus' },
  { name: 'Philemon', chapters: 1, testament: 'NT', category: 'Pauline Epistles', abbreviation: 'Phlm' },

  // General Epistles
  { name: 'Hebrews', chapters: 13, testament: 'NT', category: 'General Epistles', abbreviation: 'Heb' },
  { name: 'James', chapters: 5, testament: 'NT', category: 'General Epistles', abbreviation: 'Jas' },
  { name: '1 Peter', chapters: 5, testament: 'NT', category: 'General Epistles', abbreviation: '1Pet' },
  { name: '2 Peter', chapters: 3, testament: 'NT', category: 'General Epistles', abbreviation: '2Pet' },
  { name: '1 John', chapters: 5, testament: 'NT', category: 'General Epistles', abbreviation: '1John' },
  { name: '2 John', chapters: 1, testament: 'NT', category: 'General Epistles', abbreviation: '2John' },
  { name: '3 John', chapters: 1, testament: 'NT', category: 'General Epistles', abbreviation: '3John' },
  { name: 'Jude', chapters: 1, testament: 'NT', category: 'General Epistles', abbreviation: 'Jude' },

  // Prophecy
  { name: 'Revelation', chapters: 22, testament: 'NT', category: 'Prophecy', abbreviation: 'Rev' },
];

export const OT_CATEGORIES = ['Pentateuch', 'Historical', 'Wisdom', 'Major Prophets', 'Minor Prophets'];
export const NT_CATEGORIES = ['Gospels', 'History', 'Pauline Epistles', 'General Epistles', 'Prophecy'];

export function getBookByName(name: string): BibleBook | undefined {
  return bibleBooks.find(b => b.name === name);
}

export function getNextChapter(bookName: string, chapter: number): { book: string; chapter: number } | null {
  const book = getBookByName(bookName);
  if (!book) return null;

  if (chapter < book.chapters) {
    return { book: bookName, chapter: chapter + 1 };
  }

  const idx = bibleBooks.indexOf(book);
  if (idx < bibleBooks.length - 1) {
    return { book: bibleBooks[idx + 1].name, chapter: 1 };
  }

  return null;
}

export function getPrevChapter(bookName: string, chapter: number): { book: string; chapter: number } | null {
  const book = getBookByName(bookName);
  if (!book) return null;

  if (chapter > 1) {
    return { book: bookName, chapter: chapter - 1 };
  }

  const idx = bibleBooks.indexOf(book);
  if (idx > 0) {
    const prevBook = bibleBooks[idx - 1];
    return { book: prevBook.name, chapter: prevBook.chapters };
  }

  return null;
}
