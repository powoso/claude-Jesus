'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isFirebaseConfigured, getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  increment,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { CommunityPrayer, PrayerCategory } from '@/lib/types';

// localStorage key for tracking which prayers the user has prayed for
const PRAYED_IDS_KEY = 'dw-prayed-prayer-ids';

function loadPrayedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(PRAYED_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function savePrayedIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRAYED_IDS_KEY, JSON.stringify([...ids]));
}

interface UseCommunityPrayersReturn {
  prayers: CommunityPrayer[];
  loading: boolean;
  connected: boolean;
  addPrayer: (prayer: { name: string; request: string; category: PrayerCategory; isAnonymous: boolean }) => Promise<void>;
  togglePrayedFor: (id: string) => Promise<void>;
  deletePrayer: (id: string) => Promise<void>;
}

export function useCommunityPrayers(): UseCommunityPrayersReturn {
  const [prayers, setPrayers] = useState<CommunityPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());
  const prayedIdsRef = useRef(prayedIds);
  prayedIdsRef.current = prayedIds;

  const available = isFirebaseConfigured();

  // Load prayed IDs from localStorage
  useEffect(() => {
    setPrayedIds(loadPrayedIds());
  }, []);

  // Subscribe to Firestore communityPrayers collection
  useEffect(() => {
    if (!available) {
      setLoading(false);
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'communityPrayers'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const saved = prayedIdsRef.current;
        const result: CommunityPrayer[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || 'Anonymous',
            request: data.request || '',
            category: data.category || 'Petition',
            isAnonymous: data.isAnonymous ?? false,
            prayedCount: data.prayedCount || 0,
            hasPrayed: saved.has(d.id),
            createdAt: data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : data.createdAt || new Date().toISOString(),
          };
        });
        setPrayers(result);
        setLoading(false);
      },
      () => {
        // On error, stop loading but leave prayers empty
        setLoading(false);
      },
    );

    return unsub;
  }, [available]);

  // When prayedIds changes, update hasPrayed on existing prayers
  useEffect(() => {
    setPrayers((prev) =>
      prev.map((p) => ({ ...p, hasPrayed: prayedIds.has(p.id) })),
    );
  }, [prayedIds]);

  const addPrayer = useCallback(
    async (prayer: { name: string; request: string; category: PrayerCategory; isAnonymous: boolean }) => {
      const db = getFirebaseDb();
      if (!db) return;

      await addDoc(collection(db, 'communityPrayers'), {
        name: prayer.isAnonymous ? 'Anonymous' : prayer.name,
        request: prayer.request,
        category: prayer.category,
        isAnonymous: prayer.isAnonymous,
        prayedCount: 0,
        createdAt: serverTimestamp(),
      });
    },
    [],
  );

  const togglePrayedFor = useCallback(
    async (id: string) => {
      const db = getFirebaseDb();
      if (!db) return;

      const ref = doc(db, 'communityPrayers', id);
      const alreadyPrayed = prayedIdsRef.current.has(id);

      // Update local tracking
      const next = new Set(prayedIdsRef.current);
      if (alreadyPrayed) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setPrayedIds(next);
      savePrayedIds(next);

      // Update Firestore count
      await updateDoc(ref, {
        prayedCount: increment(alreadyPrayed ? -1 : 1),
      });
    },
    [],
  );

  const deletePrayer = useCallback(async (id: string) => {
    const db = getFirebaseDb();
    if (!db) return;
    await deleteDoc(doc(db, 'communityPrayers', id));
  }, []);

  return {
    prayers,
    loading,
    connected: available,
    addPrayer,
    togglePrayedFor,
    deletePrayer,
  };
}
