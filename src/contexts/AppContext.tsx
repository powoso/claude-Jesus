'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  Prayer,
  UserReadingProgress,
  MemoryVerse,
  GratitudeEntry,
  WeeklyCheckIn,
  AppSettings,
  JournalEntry,
} from '@/lib/types';
import { generateId, getDateKey } from '@/lib/utils';
import { useSync } from '@/contexts/SyncContext';

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
  updateGratitudeEntry: (id: string, updates: Partial<GratitudeEntry>) => void;
  deleteGratitudeEntry: (id: string) => void;

  journalEntries: JournalEntry[];
  addJournalEntry: (text: string, verseId: number, mood?: string) => void;
  updateJournalEntry: (id: string, text: string, mood?: string) => void;
  deleteJournalEntry: (id: string) => void;
  saveJournalEntry: (dateKey: string, text: string, verseId: number, mood?: string) => void;
  getJournalEntry: (dateKey: string) => JournalEntry | undefined;

  weeklyCheckIns: WeeklyCheckIn[];
  addWeeklyCheckIn: (checkIn: Omit<WeeklyCheckIn, 'id'>) => void;

  prayerDates: string[];
  memoryPracticeDates: string[];
  visitDates: string[];
  recordVisit: () => void;

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
  journal: 'dw-journal',
  visitDates: 'dw-visit-dates',
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
// Returns false if the save fails (e.g. quota exceeded) so callers can alert the user
function saveToStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Error saving to localStorage:', error);
    // Surface an alert so the user knows their data wasn't persisted
    try {
      const event = new CustomEvent('dw-storage-error', { detail: 'Your device storage is full. Please free up space or export your data from Settings.' });
      window.dispatchEvent(event);
    } catch { /* ignore */ }
    return false;
  }
}

const defaultSettings: AppSettings = {
  darkMode: false,
  fontSize: 'medium',
  hasVisitedBefore: false,
  reminderEnabled: false,
  reminderTime: '08:00',
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
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [visitDates, setVisitDates] = useState<string[]>([]);

  // Ref always holds the latest state for the beforeunload flush
  const stateRef = useRef({
    settings, prayers, readingProgress, memoryVerses,
    gratitudeEntries, weeklyCheckIns, prayerDates, memoryPracticeDates, journalEntries, visitDates,
  });
  stateRef.current = {
    settings, prayers, readingProgress, memoryVerses,
    gratitudeEntries, weeklyCheckIns, prayerDates, memoryPracticeDates, journalEntries, visitDates,
  };

  const markSaved = useCallback(() => setLastSaved(new Date()), []);

  // ── Cloud sync integration ──
  const { user, pushToCloud, pullFromCloud, startRealtimeSync, stopRealtimeSync } = useSync();
  const cloudPushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextCloudUpdate = useRef(false);

  // Debounced push to cloud (2s after last local change)
  const schedulePush = useCallback(() => {
    if (!user) return;
    if (cloudPushTimer.current) clearTimeout(cloudPushTimer.current);
    cloudPushTimer.current = setTimeout(() => {
      const s = stateRef.current;
      pushToCloud({
        settings: s.settings,
        prayers: s.prayers,
        readingProgress: s.readingProgress,
        memoryVerses: s.memoryVerses,
        gratitudeEntries: s.gratitudeEntries,
        weeklyCheckIns: s.weeklyCheckIns,
        prayerDates: s.prayerDates,
        memoryPracticeDates: s.memoryPracticeDates,
        journalEntries: s.journalEntries,
        visitDates: s.visitDates,
      });
    }, 2000);
  }, [user, pushToCloud]);

  // When user signs in: pull cloud data and merge, then start real-time listener
  useEffect(() => {
    if (!user) { stopRealtimeSync(); return; }

    let cancelled = false;
    (async () => {
      const cloud = await pullFromCloud();
      if (cancelled || !cloud) return;
      applyCloudData(cloud);

      // Start real-time sync for ongoing changes from other devices
      startRealtimeSync((data) => {
        // Skip if we just pushed (avoid echo loop)
        if (skipNextCloudUpdate.current) { skipNextCloudUpdate.current = false; return; }
        applyCloudData(data);
      });
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  /** Apply cloud data to local state + localStorage */
  const applyCloudData = useCallback((data: Record<string, unknown>) => {
    if (data.settings) { setSettings(data.settings as AppSettings); saveToStorage(KEYS.settings, data.settings); }
    if (data.prayers) { setPrayers(data.prayers as Prayer[]); saveToStorage(KEYS.prayers, data.prayers); }
    if (data.readingProgress) { setReadingProgress(data.readingProgress as UserReadingProgress[]); saveToStorage(KEYS.readingProgress, data.readingProgress); }
    if (data.memoryVerses) { setMemoryVerses(data.memoryVerses as MemoryVerse[]); saveToStorage(KEYS.memoryVerses, data.memoryVerses); }
    if (data.gratitudeEntries) { setGratitudeEntries(data.gratitudeEntries as GratitudeEntry[]); saveToStorage(KEYS.gratitude, data.gratitudeEntries); }
    if (data.weeklyCheckIns) { setWeeklyCheckIns(data.weeklyCheckIns as WeeklyCheckIn[]); saveToStorage(KEYS.weeklyCheckIns, data.weeklyCheckIns); }
    if (data.prayerDates) { setPrayerDates(data.prayerDates as string[]); saveToStorage(KEYS.prayerDates, data.prayerDates); }
    if (data.memoryPracticeDates) { setMemoryPracticeDates(data.memoryPracticeDates as string[]); saveToStorage(KEYS.memoryPracticeDates, data.memoryPracticeDates); }
    if (data.journalEntries) { setJournalEntries(data.journalEntries as JournalEntry[]); saveToStorage(KEYS.journal, data.journalEntries); }
    if (data.visitDates) { setVisitDates(data.visitDates as string[]); saveToStorage(KEYS.visitDates, data.visitDates); }
    markSaved();
  }, [markSaved]);

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
    setJournalEntries(loadFromStorage(KEYS.journal, []));
    setVisitDates(loadFromStorage(KEYS.visitDates, []));
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
      saveToStorage(KEYS.journal, s.journalEntries);
      saveToStorage(KEYS.visitDates, s.visitDates);
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
          case KEYS.journal: setJournalEntries(val); break;
          case KEYS.visitDates: setVisitDates(val); break;
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
      skipNextCloudUpdate.current = true;
      schedulePush();
      return next;
    });
  }, [markSaved, schedulePush]);

  const syncAfterSave = useCallback(() => {
    skipNextCloudUpdate.current = true;
    schedulePush();
  }, [schedulePush]);

  const recordVisit = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setVisitDates(prev => {
      if (prev.includes(today)) return prev;
      const next = [...prev, today];
      saveToStorage(KEYS.visitDates, next);
      return next;
    });
  }, []);

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
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const updatePrayer = useCallback((id: string, updates: Partial<Prayer>) => {
    setPrayers(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      saveToStorage(KEYS.prayers, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const deletePrayer = useCallback((id: string) => {
    setPrayers(prev => {
      const next = prev.filter(p => p.id !== id);
      saveToStorage(KEYS.prayers, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

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
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

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
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const resetPlan = useCallback((planId: string) => {
    setReadingProgress(prev => {
      const next = prev.filter(p => p.planId !== planId);
      saveToStorage(KEYS.readingProgress, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const addMemoryVerse = useCallback((reference: string, text: string) => {
    const newVerse: MemoryVerse = {
      id: generateId(),
      reference,
      text,
      mastery: 'Learning',
      lastReviewed: new Date().toISOString(),
      addedDate: new Date().toISOString(),
      practiceCount: 0,
      interval: 0,
      easeFactor: 2.5,
    };
    setMemoryVerses(prev => {
      const next = [newVerse, ...prev];
      saveToStorage(KEYS.memoryVerses, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

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
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const deleteMemoryVerse = useCallback((id: string) => {
    setMemoryVerses(prev => {
      const next = prev.filter(v => v.id !== id);
      saveToStorage(KEYS.memoryVerses, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

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
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const updateGratitudeEntry = useCallback((id: string, updates: Partial<GratitudeEntry>) => {
    setGratitudeEntries(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      saveToStorage(KEYS.gratitude, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const deleteGratitudeEntry = useCallback((id: string) => {
    setGratitudeEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      saveToStorage(KEYS.gratitude, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const addJournalEntry = useCallback((text: string, verseId: number, mood?: string) => {
    const now = new Date().toISOString();
    const newEntry: JournalEntry = {
      id: generateId(),
      dateKey: getDateKey(),
      text,
      verseId,
      ...(mood ? { mood: mood as JournalEntry['mood'] } : {}),
      createdAt: now,
      updatedAt: now,
    };
    setJournalEntries(prev => {
      const next = [newEntry, ...prev];
      saveToStorage(KEYS.journal, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const updateJournalEntry = useCallback((id: string, text: string, mood?: string) => {
    setJournalEntries(prev => {
      const next = prev.map(e => e.id === id
        ? { ...e, text, mood: (mood as JournalEntry['mood']) ?? undefined, updatedAt: new Date().toISOString() }
        : e
      );
      saveToStorage(KEYS.journal, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournalEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      saveToStorage(KEYS.journal, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  // Used by the devotional page for its per-day journal (create-or-update by dateKey)
  const saveJournalEntry = useCallback((dateKey: string, text: string, verseId: number, mood?: string) => {
    setJournalEntries(prev => {
      const existing = prev.find(e => e.dateKey === dateKey);
      let next: JournalEntry[];
      if (existing) {
        next = prev.map(e => e.dateKey === dateKey
          ? { ...e, text, verseId, ...(mood !== undefined ? { mood: mood as JournalEntry['mood'] } : {}), updatedAt: new Date().toISOString() }
          : e
        );
      } else {
        next = [{
          id: generateId(),
          dateKey,
          text,
          verseId,
          ...(mood ? { mood: mood as JournalEntry['mood'] } : {}),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, ...prev];
      }
      saveToStorage(KEYS.journal, next);
      markSaved();
      return next;
    });
    syncAfterSave();
  }, [markSaved, syncAfterSave]);

  const getJournalEntry = useCallback((dateKey: string): JournalEntry | undefined => {
    return journalEntries.find(e => e.dateKey === dateKey);
  }, [journalEntries]);

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
      journalEntries,
      visitDates,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }, [settings, prayers, readingProgress, memoryVerses, gratitudeEntries, weeklyCheckIns, prayerDates, memoryPracticeDates, journalEntries, visitDates]);

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
      if (data.journalEntries) { setJournalEntries(data.journalEntries); saveToStorage(KEYS.journal, data.journalEntries); }
      if (data.visitDates) { setVisitDates(data.visitDates); saveToStorage(KEYS.visitDates, data.visitDates); }
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
      updateGratitudeEntry,
      deleteGratitudeEntry,
      journalEntries,
      addJournalEntry,
      updateJournalEntry,
      deleteJournalEntry,
      saveJournalEntry,
      getJournalEntry,
      weeklyCheckIns,
      addWeeklyCheckIn,
      prayerDates,
      memoryPracticeDates,
      visitDates,
      recordVisit,
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
