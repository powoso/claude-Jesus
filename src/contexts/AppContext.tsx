'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  Prayer,
  UserReadingProgress,
  MemoryVerse,
  GratitudeEntry,
  WeeklyCheckIn,
  AppSettings,
} from '@/lib/types';
import { generateId } from '@/lib/utils';

interface AppState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  prayers: Prayer[];
  addPrayer: (prayer: Omit<Prayer, 'id' | 'createdAt' | 'isAnswered'>) => void;
  updatePrayer: (id: string, updates: Partial<Prayer>) => void;
  deletePrayer: (id: string) => void;

  readingProgress: UserReadingProgress[];
  startPlan: (planId: string) => void;
  toggleReadingDay: (planId: string, day: number) => void;
  resetPlan: (planId: string) => void;

  memoryVerses: MemoryVerse[];
  addMemoryVerse: (reference: string, text: string) => void;
  updateMemoryVerse: (id: string, updates: Partial<MemoryVerse>) => void;
  deleteMemoryVerse: (id: string) => void;

  gratitudeEntries: GratitudeEntry[];
  addGratitudeEntry: (entry: Omit<GratitudeEntry, 'id' | 'date'>) => void;
  deleteGratitudeEntry: (id: string) => void;

  weeklyCheckIns: WeeklyCheckIn[];
  addWeeklyCheckIn: (checkIn: Omit<WeeklyCheckIn, 'id'>) => void;

  prayerDates: string[];
  memoryPracticeDates: string[];

  exportData: () => string;
  importData: (json: string) => boolean;

  isHydrated: boolean;
  lastSaved: Date | null;
}

const AppContext = createContext<AppState | undefined>(undefined);

// Centralised storage keys
const KEYS = {
  settings: 'dw-settings',
  prayers: 'dw-prayers',
  readingProgress: 'dw-reading-progress',
  memoryVerses: 'dw-memory-verses',
  gratitude: 'dw-gratitude',
  weeklyCheckIns: 'dw-weekly-checkins',
  prayerDates: 'dw-prayer-dates',
  memoryPracticeDates: 'dw-memory-practice-dates',
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

// Synchronous write-through — data hits localStorage the instant it changes
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Error saving to localStorage:', error);
  }
}

const defaultSettings: AppSettings = {
  darkMode: false,
  fontSize: 'medium',
  hasVisitedBefore: false,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [readingProgress, setReadingProgress] = useState<UserReadingProgress[]>([]);
  const [memoryVerses, setMemoryVerses] = useState<MemoryVerse[]>([]);
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [weeklyCheckIns, setWeeklyCheckIns] = useState<WeeklyCheckIn[]>([]);
  const [prayerDates, setPrayerDates] = useState<string[]>([]);
  const [memoryPracticeDates, setMemoryPracticeDates] = useState<string[]>([]);

  // Ref always holds the latest state for the beforeunload flush
  const stateRef = useRef({
    settings, prayers, readingProgress, memoryVerses,
    gratitudeEntries, weeklyCheckIns, prayerDates, memoryPracticeDates,
  });
  stateRef.current = {
    settings, prayers, readingProgress, memoryVerses,
    gratitudeEntries, weeklyCheckIns, prayerDates, memoryPracticeDates,
  };

  const markSaved = useCallback(() => setLastSaved(new Date()), []);

  // ── Hydrate from localStorage on first mount ──
  useEffect(() => {
    setSettings(loadFromStorage(KEYS.settings, defaultSettings));
    setPrayers(loadFromStorage(KEYS.prayers, []));
    setReadingProgress(loadFromStorage(KEYS.readingProgress, []));
    setMemoryVerses(loadFromStorage(KEYS.memoryVerses, []));
    setGratitudeEntries(loadFromStorage(KEYS.gratitude, []));
    setWeeklyCheckIns(loadFromStorage(KEYS.weeklyCheckIns, []));
    setPrayerDates(loadFromStorage(KEYS.prayerDates, []));
    setMemoryPracticeDates(loadFromStorage(KEYS.memoryPracticeDates, []));
    setIsHydrated(true);
  }, []);

  // ── Safety flush: save everything when the tab closes or hides ──
  useEffect(() => {
    const flush = () => {
      const s = stateRef.current;
      saveToStorage(KEYS.settings, s.settings);
      saveToStorage(KEYS.prayers, s.prayers);
      saveToStorage(KEYS.readingProgress, s.readingProgress);
      saveToStorage(KEYS.memoryVerses, s.memoryVerses);
      saveToStorage(KEYS.gratitude, s.gratitudeEntries);
      saveToStorage(KEYS.weeklyCheckIns, s.weeklyCheckIns);
      saveToStorage(KEYS.prayerDates, s.prayerDates);
      saveToStorage(KEYS.memoryPracticeDates, s.memoryPracticeDates);
    };

    const onVisChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  // ── Cross-tab sync: pick up changes made in another tab ──
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        const val = JSON.parse(e.newValue);
        switch (e.key) {
          case KEYS.settings: setSettings(val); break;
          case KEYS.prayers: setPrayers(val); break;
          case KEYS.readingProgress: setReadingProgress(val); break;
          case KEYS.memoryVerses: setMemoryVerses(val); break;
          case KEYS.gratitude: setGratitudeEntries(val); break;
          case KEYS.weeklyCheckIns: setWeeklyCheckIns(val); break;
          case KEYS.prayerDates: setPrayerDates(val); break;
          case KEYS.memoryPracticeDates: setMemoryPracticeDates(val); break;
        }
      } catch { /* ignore parse errors from other apps */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Dark mode class ──
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.classList.toggle('dark', settings.darkMode);
    }
  }, [settings.darkMode, isHydrated]);

  // ── Font size ──
  useEffect(() => {
    if (isHydrated) {
      const root = document.documentElement;
      root.classList.remove('text-sm', 'text-base', 'text-lg');
      if (settings.fontSize === 'small') root.classList.add('text-sm');
      else if (settings.fontSize === 'large') root.classList.add('text-lg');
      else root.classList.add('text-base');
    }
  }, [settings.fontSize, isHydrated]);

  // ────────────────────────────────────────────────
  // All mutations use write-through: setState + synchronous localStorage.setItem
  // Data is persisted the instant you tap a button — even if you force-close
  // the browser a millisecond later, nothing is lost.
  // ────────────────────────────────────────────────

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveToStorage(KEYS.settings, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const addPrayer = useCallback((prayer: Omit<Prayer, 'id' | 'createdAt' | 'isAnswered'>) => {
    const newPrayer: Prayer = {
      ...prayer,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isAnswered: false,
    };
    setPrayers(prev => {
      const next = [newPrayer, ...prev];
      saveToStorage(KEYS.prayers, next);
      markSaved();
      return next;
    });
    setPrayerDates(prev => {
      const next = [...prev, new Date().toISOString()];
      saveToStorage(KEYS.prayerDates, next);
      return next;
    });
  }, [markSaved]);

  const updatePrayer = useCallback((id: string, updates: Partial<Prayer>) => {
    setPrayers(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      saveToStorage(KEYS.prayers, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const deletePrayer = useCallback((id: string) => {
    setPrayers(prev => {
      const next = prev.filter(p => p.id !== id);
      saveToStorage(KEYS.prayers, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const startPlan = useCallback((planId: string) => {
    setReadingProgress(prev => {
      if (prev.find(p => p.planId === planId)) return prev;
      const next = [...prev, {
        planId,
        startDate: new Date().toISOString(),
        completedDays: [],
        currentDay: 1,
      }];
      saveToStorage(KEYS.readingProgress, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const toggleReadingDay = useCallback((planId: string, day: number) => {
    setReadingProgress(prev => {
      const next = prev.map(p => {
        if (p.planId !== planId) return p;
        const completed = p.completedDays.includes(day)
          ? p.completedDays.filter(d => d !== day)
          : [...p.completedDays, day];
        return { ...p, completedDays: completed, currentDay: Math.max(...completed, 0) + 1 };
      });
      saveToStorage(KEYS.readingProgress, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const resetPlan = useCallback((planId: string) => {
    setReadingProgress(prev => {
      const next = prev.filter(p => p.planId !== planId);
      saveToStorage(KEYS.readingProgress, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const addMemoryVerse = useCallback((reference: string, text: string) => {
    const newVerse: MemoryVerse = {
      id: generateId(),
      reference,
      text,
      mastery: 'Learning',
      lastReviewed: new Date().toISOString(),
      addedDate: new Date().toISOString(),
      practiceCount: 0,
    };
    setMemoryVerses(prev => {
      const next = [newVerse, ...prev];
      saveToStorage(KEYS.memoryVerses, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const updateMemoryVerse = useCallback((id: string, updates: Partial<MemoryVerse>) => {
    setMemoryVerses(prev => {
      const next = prev.map(v => v.id === id ? { ...v, ...updates } : v);
      saveToStorage(KEYS.memoryVerses, next);
      markSaved();
      return next;
    });
    if (updates.practiceCount !== undefined || updates.lastReviewed) {
      setMemoryPracticeDates(prev => {
        const next = [...prev, new Date().toISOString()];
        saveToStorage(KEYS.memoryPracticeDates, next);
        return next;
      });
    }
  }, [markSaved]);

  const deleteMemoryVerse = useCallback((id: string) => {
    setMemoryVerses(prev => {
      const next = prev.filter(v => v.id !== id);
      saveToStorage(KEYS.memoryVerses, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const addGratitudeEntry = useCallback((entry: Omit<GratitudeEntry, 'id' | 'date'>) => {
    const newEntry: GratitudeEntry = {
      ...entry,
      id: generateId(),
      date: new Date().toISOString(),
    };
    setGratitudeEntries(prev => {
      const next = [newEntry, ...prev];
      saveToStorage(KEYS.gratitude, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const deleteGratitudeEntry = useCallback((id: string) => {
    setGratitudeEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      saveToStorage(KEYS.gratitude, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const addWeeklyCheckIn = useCallback((checkIn: Omit<WeeklyCheckIn, 'id'>) => {
    const newCheckIn: WeeklyCheckIn = { ...checkIn, id: generateId() };
    setWeeklyCheckIns(prev => {
      const next = [newCheckIn, ...prev];
      saveToStorage(KEYS.weeklyCheckIns, next);
      markSaved();
      return next;
    });
  }, [markSaved]);

  const exportData = useCallback(() => {
    return JSON.stringify({
      settings,
      prayers,
      readingProgress,
      memoryVerses,
      gratitudeEntries,
      weeklyCheckIns,
      prayerDates,
      memoryPracticeDates,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }, [settings, prayers, readingProgress, memoryVerses, gratitudeEntries, weeklyCheckIns, prayerDates, memoryPracticeDates]);

  const importData = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json);
      // Write-through every imported field
      if (data.settings) { setSettings(data.settings); saveToStorage(KEYS.settings, data.settings); }
      if (data.prayers) { setPrayers(data.prayers); saveToStorage(KEYS.prayers, data.prayers); }
      if (data.readingProgress) { setReadingProgress(data.readingProgress); saveToStorage(KEYS.readingProgress, data.readingProgress); }
      if (data.memoryVerses) { setMemoryVerses(data.memoryVerses); saveToStorage(KEYS.memoryVerses, data.memoryVerses); }
      if (data.gratitudeEntries) { setGratitudeEntries(data.gratitudeEntries); saveToStorage(KEYS.gratitude, data.gratitudeEntries); }
      if (data.weeklyCheckIns) { setWeeklyCheckIns(data.weeklyCheckIns); saveToStorage(KEYS.weeklyCheckIns, data.weeklyCheckIns); }
      if (data.prayerDates) { setPrayerDates(data.prayerDates); saveToStorage(KEYS.prayerDates, data.prayerDates); }
      if (data.memoryPracticeDates) { setMemoryPracticeDates(data.memoryPracticeDates); saveToStorage(KEYS.memoryPracticeDates, data.memoryPracticeDates); }
      markSaved();
      return true;
    } catch {
      return false;
    }
  }, [markSaved]);

  return (
    <AppContext.Provider value={{
      settings,
      updateSettings,
      prayers,
      addPrayer,
      updatePrayer,
      deletePrayer,
      readingProgress,
      startPlan,
      toggleReadingDay,
      resetPlan,
      memoryVerses,
      addMemoryVerse,
      updateMemoryVerse,
      deleteMemoryVerse,
      gratitudeEntries,
      addGratitudeEntry,
      deleteGratitudeEntry,
      weeklyCheckIns,
      addWeeklyCheckIn,
      prayerDates,
      memoryPracticeDates,
      exportData,
      importData,
      isHydrated,
      lastSaved,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
