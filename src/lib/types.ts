export interface BibleVerse {
  id: number;
  reference: string;
  text: string;
  theme: string;
}

export interface DevotionalReflection {
  id: number;
  questions: string[];
  reflection: string;
}

export interface Prayer {
  id: string;
  title: string;
  description: string;
  date: string;
  category: PrayerCategory;
  isAnswered: boolean;
  answeredDate?: string;
  testimonyNotes?: string;
  createdAt: string;
}

export type PrayerCategory =
  | 'Gratitude'
  | 'Intercession'
  | 'Confession'
  | 'Petition'
  | 'Praise'
  | 'Healing'
  | 'Guidance';

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: string;
  totalDays: number;
  readings: DailyReading[];
}

export interface DailyReading {
  day: number;
  title: string;
  passages: string[];
  completed: boolean;
}

export interface UserReadingProgress {
  planId: string;
  startDate: string;
  completedDays: number[];
  currentDay: number;
}

export interface MemoryVerse {
  id: string;
  reference: string;
  text: string;
  mastery: 'Learning' | 'Familiar' | 'Memorized';
  lastReviewed: string;
  addedDate: string;
  practiceCount: number;
  /** Spaced repetition interval in days — next review due at lastReviewed + interval */
  interval: number;
  /** Ease factor for SM-2 algorithm (default 2.5) */
  easeFactor: number;
}

export interface JournalEntry {
  id: string;
  /** Day-of-year key like "2026-58" for consistent lookup */
  dateKey: string;
  text: string;
  verseId: number;
  createdAt: string;
  updatedAt: string;
}

export interface GratitudeEntry {
  id: string;
  text: string;
  scriptureReference?: string;
  date: string;
  category: 'Gratitude' | 'Praise' | 'Worship';
}

export interface WeeklyCheckIn {
  id: string;
  date: string;
  weekNumber: number;
  year: number;
  ratings: {
    prayerLife: number;
    scriptureReading: number;
    worship: number;
    service: number;
    fellowship: number;
  };
}

export interface AppSettings {
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  hasVisitedBefore: boolean;
  reminderEnabled: boolean;
  reminderTime: string; // HH:mm format, e.g. "08:00"
}
