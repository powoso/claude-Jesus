'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Prayers
  prayers: Prayer[];
  addPrayer: (prayer: Omit<Prayer, 'id' | 'createdAt' | 'isAnswered'>) => void;
  updatePrayer: (id: string, updates: Partial<Prayer>) => void;
  deletePrayer: (id: string) => void;

  // Reading Progress
  readingProgress: UserReadingProgress[];
  startPlan: (planId: string) => void;
  toggleReadingDay: (planId: string, day: number) => void;
  resetPlan: (planId: string) => void;

  // Memory Verses
  memoryVerses: MemoryVerse[];
  addMemoryVerse: (reference: string, text: string) => void;
  updateMemoryVerse: (id: string, updates: Partial<MemoryVerse>) => void;
  deleteMemoryVerse: (id: string) => void;

  // Gratitude
  gratitudeEntries: GratitudeEntry[];
  addGratitudeEntry: (entry: Omit<GratitudeEntry, 'id' | 'date'>) => void;
  deleteGratitudeEntry: (id: string) => void;

  // Growth
  weeklyCheckIns: WeeklyCheckIn[];
  addWeeklyCheckIn: (checkIn: Omit<WeeklyCheckIn, 'id'>) => void;

  // Streaks
  prayerDates: string[];
  memoryPracticeDates: string[];

  // Data export/import
  exportData: () => string;
  importData: (json: string) => boolean;

  isHydrated: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

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
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [readingProgress, setReadingProgress] = useState<UserReadingProgress[]>([]);
  const [memoryVerses, setMemoryVerses] = useState<MemoryVerse[]>([]);
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [weeklyCheckIns, setWeeklyCheckIns] = useState<WeeklyCheckIn[]>([]);
  const [prayerDates, setPrayerDates] = useState<string[]>([]);
  const [memoryPracticeDates, setMemoryPracticeDates] = useState<string[]>([]);

  // Hydrate from localStorage
  useEffect(() => {
    setSettings(loadFromStorage('dw-settings', defaultSettings));
    setPrayers(loadFromStorage('dw-prayers', []));
    setReadingProgress(loadFromStorage('dw-reading-progress', []));
    setMemoryVerses(loadFromStorage('dw-memory-verses', []));
    setGratitudeEntries(loadFromStorage('dw-gratitude', []));
    setWeeklyCheckIns(loadFromStorage('dw-weekly-checkins', []));
    setPrayerDates(loadFromStorage('dw-prayer-dates', []));
    setMemoryPracticeDates(loadFromStorage('dw-memory-practice-dates', []));
    setIsHydrated(true);
  }, []);

  // Persist settings changes
  useEffect(() => {
    if (isHydrated) saveToStorage('dw-settings', settings);
  }, [settings, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveToStorage('dw-prayers', prayers);
  }, [prayers, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveToStorage('dw-reading-progress', readingProgress);
  }, [readingProgress, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveToStorage('dw-memory-verses', memoryVerses);
  }, [memoryVerses, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveToStorage('dw-gratitude', gratitudeEntries);
  }, [gratitudeEntries, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveToStorage('dw-weekly-checkins', weeklyCheckIns);
  }, [weeklyCheckIns, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveToStorage('dw-prayer-dates', prayerDates);
  }, [prayerDates, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveToStorage('dw-memory-practice-dates', memoryPracticeDates);
  }, [memoryPracticeDates, isHydrated]);

  // Dark mode class
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.classList.toggle('dark', settings.darkMode);
    }
  }, [settings.darkMode, isHydrated]);

  // Font size
  useEffect(() => {
    if (isHydrated) {
      const root = document.documentElement;
      root.classList.remove('text-sm', 'text-base', 'text-lg');
      if (settings.fontSize === 'small') root.classList.add('text-sm');
      else if (settings.fontSize === 'large') root.classList.add('text-lg');
      else root.classList.add('text-base');
    }
  }, [settings.fontSize, isHydrated]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const addPrayer = useCallback((prayer: Omit<Prayer, 'id' | 'createdAt' | 'isAnswered'>) => {
    const newPrayer: Prayer = {
      ...prayer,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isAnswered: false,
    };
    setPrayers(prev => [newPrayer, ...prev]);
    setPrayerDates(prev => [...prev, new Date().toISOString()]);
  }, []);

  const updatePrayer = useCallback((id: string, updates: Partial<Prayer>) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePrayer = useCallback((id: string) => {
    setPrayers(prev => prev.filter(p => p.id !== id));
  }, []);

  const startPlan = useCallback((planId: string) => {
    setReadingProgress(prev => {
      const existing = prev.find(p => p.planId === planId);
      if (existing) return prev;
      return [...prev, {
        planId,
        startDate: new Date().toISOString(),
        completedDays: [],
        currentDay: 1,
      }];
    });
  }, []);

  const toggleReadingDay = useCallback((planId: string, day: number) => {
    setReadingProgress(prev => prev.map(p => {
      if (p.planId !== planId) return p;
      const completed = p.completedDays.includes(day)
        ? p.completedDays.filter(d => d !== day)
        : [...p.completedDays, day];
      return { ...p, completedDays: completed, currentDay: Math.max(...completed, 0) + 1 };
    }));
  }, []);

  const resetPlan = useCallback((planId: string) => {
    setReadingProgress(prev => prev.filter(p => p.planId !== planId));
  }, []);

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
    setMemoryVerses(prev => [newVerse, ...prev]);
  }, []);

  const updateMemoryVerse = useCallback((id: string, updates: Partial<MemoryVerse>) => {
    setMemoryVerses(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    if (updates.practiceCount !== undefined || updates.lastReviewed) {
      setMemoryPracticeDates(prev => [...prev, new Date().toISOString()]);
    }
  }, []);

  const deleteMemoryVerse = useCallback((id: string) => {
    setMemoryVerses(prev => prev.filter(v => v.id !== id));
  }, []);

  const addGratitudeEntry = useCallback((entry: Omit<GratitudeEntry, 'id' | 'date'>) => {
    const newEntry: GratitudeEntry = {
      ...entry,
      id: generateId(),
      date: new Date().toISOString(),
    };
    setGratitudeEntries(prev => [newEntry, ...prev]);
  }, []);

  const deleteGratitudeEntry = useCallback((id: string) => {
    setGratitudeEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const addWeeklyCheckIn = useCallback((checkIn: Omit<WeeklyCheckIn, 'id'>) => {
    const newCheckIn: WeeklyCheckIn = { ...checkIn, id: generateId() };
    setWeeklyCheckIns(prev => [newCheckIn, ...prev]);
  }, []);

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
      if (data.settings) setSettings(data.settings);
      if (data.prayers) setPrayers(data.prayers);
      if (data.readingProgress) setReadingProgress(data.readingProgress);
      if (data.memoryVerses) setMemoryVerses(data.memoryVerses);
      if (data.gratitudeEntries) setGratitudeEntries(data.gratitudeEntries);
      if (data.weeklyCheckIns) setWeeklyCheckIns(data.weeklyCheckIns);
      if (data.prayerDates) setPrayerDates(data.prayerDates);
      if (data.memoryPracticeDates) setMemoryPracticeDates(data.memoryPracticeDates);
      return true;
    } catch {
      return false;
    }
  }, []);

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
