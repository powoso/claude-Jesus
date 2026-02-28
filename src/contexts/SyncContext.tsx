'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { isFirebaseConfigured, getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncState {
  /** Whether Firebase is configured (env vars present) */
  available: boolean;
  /** Firebase auth user, null if not signed in */
  user: User | null;
  /** true while auth state is loading */
  authLoading: boolean;
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Last error message */
  lastError: string | null;
  /** Sign in with email/password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Create a new account */
  signUp: (email: string, password: string) => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Send password reset email */
  resetPassword: (email: string) => Promise<void>;
  /** Push all local data to the cloud RIGHT NOW */
  pushToCloud: (data: Record<string, unknown>) => Promise<void>;
  /** Pull cloud data and return it — caller merges into local state */
  pullFromCloud: () => Promise<Record<string, unknown> | null>;
  /** Enable real-time listener — calls onData whenever cloud changes */
  startRealtimeSync: (onData: (data: Record<string, unknown>) => void) => void;
  /** Stop real-time listener */
  stopRealtimeSync: () => void;
}

const SyncContext = createContext<SyncState | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const available = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(available);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);

  // Listen to auth state
  useEffect(() => {
    if (!available) { setAuthLoading(false); return; }
    const auth = getFirebaseAuth();
    if (!auth) { setAuthLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, [available]);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    setLastError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setLastError(msg);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    setLastError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      setLastError(msg);
      throw err;
    }
  }, []);

  const signOutFn = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    await firebaseSignOut(auth);
    setSyncStatus('idle');
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    await sendPasswordResetEmail(auth, email);
  }, []);

  const getUserDocRef = useCallback(() => {
    const db = getFirebaseDb();
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [user]);

  const pushToCloud = useCallback(async (data: Record<string, unknown>) => {
    const ref = getUserDocRef();
    if (!ref) return;
    setSyncStatus('syncing');
    try {
      await setDoc(ref, { ...data, lastSynced: serverTimestamp() }, { merge: true });
      setSyncStatus('synced');
      setLastError(null);
    } catch (err: unknown) {
      setSyncStatus('error');
      setLastError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, [getUserDocRef]);

  const pullFromCloud = useCallback(async (): Promise<Record<string, unknown> | null> => {
    const ref = getUserDocRef();
    if (!ref) return null;
    setSyncStatus('syncing');
    try {
      const snap = await getDoc(ref);
      setSyncStatus('synced');
      setLastError(null);
      if (snap.exists()) {
        return snap.data() as Record<string, unknown>;
      }
      return null;
    } catch (err: unknown) {
      setSyncStatus('error');
      setLastError(err instanceof Error ? err.message : 'Pull failed');
      return null;
    }
  }, [getUserDocRef]);

  const startRealtimeSync = useCallback((onData: (data: Record<string, unknown>) => void) => {
    // Clean up previous listener
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    const ref = getUserDocRef();
    if (!ref) return;
    unsubRef.current = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSyncStatus('synced');
          onData(snap.data() as Record<string, unknown>);
        }
      },
      (err) => {
        setSyncStatus('error');
        setLastError(err.message);
      }
    );
  }, [getUserDocRef]);

  const stopRealtimeSync = useCallback(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
  }, []);

  // Clean up listener on unmount
  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  return (
    <SyncContext.Provider value={{
      available,
      user,
      authLoading,
      syncStatus,
      lastError,
      signIn,
      signUp,
      signOut: signOutFn,
      resetPassword,
      pushToCloud,
      pullFromCloud,
      startRealtimeSync,
      stopRealtimeSync,
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncState {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within a SyncProvider');
  return ctx;
}
