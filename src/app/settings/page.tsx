'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Sun, Moon, Type, Download, Upload, Trash2,
  Check, AlertCircle, Info, Cloud, CloudOff, LogIn, LogOut,
  RefreshCw, Mail, Lock, UserPlus, Loader2,
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { useApp } from '@/contexts/AppContext';
import { useSync } from '@/contexts/SyncContext';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

function friendlyError(msg: string): string {
  if (msg.includes('auth/invalid-email')) return 'Invalid email address.';
  if (msg.includes('auth/user-not-found') || msg.includes('auth/invalid-credential')) return 'Email or password is incorrect.';
  if (msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) return 'Email or password is incorrect.';
  if (msg.includes('auth/email-already-in-use')) return 'An account with this email already exists.';
  if (msg.includes('auth/weak-password')) return 'Password must be at least 6 characters.';
  if (msg.includes('auth/too-many-requests')) return 'Too many attempts. Please wait a moment.';
  return msg;
}

export default function SettingsPage() {
  const { settings, updateSettings, exportData, importData } = useApp();
  const sync = useSync();
  const { showToast } = useToast();
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-walk-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importData(text);
      setImportStatus(success ? 'success' : 'error');
      showToast(success ? 'Data imported successfully' : 'Failed to import data', success ? 'success' : 'error');
      setTimeout(() => setImportStatus('idle'), 3000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone. Consider exporting a backup first.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authMode === 'signin') {
        await sync.signIn(email, password);
        showToast('Signed in — syncing your data');
      } else {
        await sync.signUp(email, password);
        showToast('Account created — syncing your data');
      }
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(friendlyError(msg));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await sync.signOut();
    showToast('Signed out');
  };

  const handleResetPassword = async () => {
    if (!email) { setAuthError('Enter your email first.'); return; }
    try {
      await sync.resetPassword(email);
      setResetSent(true);
      showToast('Password reset email sent');
    } catch {
      setAuthError('Could not send reset email. Check the address.');
    }
  };

  const handleManualSync = async () => {
    const data = JSON.parse(exportData());
    delete data.exportDate;
    await sync.pushToCloud(data);
    showToast('Data synced to cloud');
  };

  const syncStatusLabel = {
    idle: 'Not connected',
    syncing: 'Syncing...',
    synced: 'Synced',
    error: 'Sync error',
    offline: 'Offline',
  };

  const syncStatusColor = {
    idle: 'text-[var(--text-muted)]',
    syncing: 'text-amber-500',
    synced: 'text-emerald-500',
    error: 'text-red-500',
    offline: 'text-[var(--text-muted)]',
  };

  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        subtitle="Customize your Daily Walk experience."
        icon={<Settings size={28} />}
      />

      <div className="space-y-6 max-w-2xl">
        {/* Appearance */}
        <Card>
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-4">Appearance</h2>

          {/* Dark Mode */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon size={18} className="text-[var(--accent)]" /> : <Sun size={18} className="text-[var(--accent)]" />}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Dark Mode</p>
                <p className="text-xs text-[var(--text-muted)]">Deep navy with gold accents</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.darkMode ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'
              }`}
              role="switch"
              aria-checked={settings.darkMode}
              aria-label="Toggle dark mode"
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ left: settings.darkMode ? '26px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Type size={18} className="text-[var(--accent)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Font Size</p>
                <p className="text-xs text-[var(--text-muted)]">Adjust text size for comfort</p>
              </div>
            </div>
            <div className="flex gap-1">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => updateSettings({ fontSize: size })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.fontSize === size
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                  aria-label={`Set font size to ${size}`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Cloud Sync */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">Cloud Sync</h2>
            {sync.available && sync.user && (
              <div className="flex items-center gap-1.5">
                {sync.syncStatus === 'syncing' ? (
                  <Loader2 size={14} className="text-amber-500 animate-spin" />
                ) : sync.syncStatus === 'synced' ? (
                  <Cloud size={14} className="text-emerald-500" />
                ) : sync.syncStatus === 'error' ? (
                  <CloudOff size={14} className="text-red-500" />
                ) : (
                  <Cloud size={14} className="text-[var(--text-muted)]" />
                )}
                <span className={`text-xs font-medium ${syncStatusColor[sync.syncStatus]}`}>
                  {syncStatusLabel[sync.syncStatus]}
                </span>
              </div>
            )}
          </div>

          {!sync.available ? (
            /* Firebase not configured */
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <CloudOff size={18} className="text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-secondary)]">
                  Cloud sync is not yet configured. Your data is saved locally on this device.
                </p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-xs text-[var(--text-muted)] space-y-2">
                <p className="font-medium text-[var(--text-secondary)]">To enable cloud sync:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Create a Firebase project at console.firebase.google.com</li>
                  <li>Enable Email/Password authentication</li>
                  <li>Enable Cloud Firestore database</li>
                  <li>Add your Firebase config as environment variables in your hosting platform</li>
                  <li>Redeploy the app</li>
                </ol>
              </div>
            </div>
          ) : sync.user ? (
            /* Signed in */
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                  <Mail size={14} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{sync.user.email}</p>
                  <p className="text-xs text-[var(--text-muted)]">Signed in — data syncs automatically</p>
                </div>
              </div>

              {sync.lastError && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">{sync.lastError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleManualSync}>
                  <RefreshCw size={14} />
                  Sync Now
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut size={14} />
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            /* Sign in / Sign up form */
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Sign in to sync your data across all your devices. Your entries, prayers, and progress stay safe in the cloud.
              </p>

              <form onSubmit={handleAuth} className="space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setAuthError(null); setResetSent(false); }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    required
                    minLength={6}
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  />
                </div>

                {authError && (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle size={12} />
                    {authError}
                  </div>
                )}

                {resetSent && (
                  <div className="flex items-center gap-2 text-xs text-emerald-500">
                    <Check size={12} />
                    Reset email sent — check your inbox.
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : authMode === 'signin' ? (
                    <><LogIn size={16} /> Sign In</>
                  ) : (
                    <><UserPlus size={16} /> Create Account</>
                  )}
                </Button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(null); }}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {authMode === 'signin' ? 'Create an account' : 'Already have an account?'}
                  </button>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </Card>

        {/* Data Management */}
        <Card>
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-4">Data Management</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Export Data</p>
                  <p className="text-xs text-[var(--text-muted)]">Download a JSON backup of all your data</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download size={14} /> Export
              </Button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Upload size={18} className="text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Import Data</p>
                  <p className="text-xs text-[var(--text-muted)]">Restore from a JSON backup file</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {importStatus === 'success' && <Check size={14} className="text-emerald-500" />}
                {importStatus === 'error' && <AlertCircle size={14} className="text-red-500" />}
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  aria-label="Import data file"
                />
              </div>
            </div>

            <div className="border-t border-[var(--border-color)] pt-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Trash2 size={18} className="text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Clear All Data</p>
                    <p className="text-xs text-[var(--text-muted)]">Permanently delete all saved data</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearData}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} /> Clear
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* About Link */}
        <Card>
          <Link href="/about" className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-[var(--accent)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  About Daily Walk
                </p>
                <p className="text-xs text-[var(--text-muted)]">Learn about the mission behind this app</p>
              </div>
            </div>
          </Link>
        </Card>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="font-scripture text-sm text-[var(--text-muted)]">
            &ldquo;Whatever you do, work at it with all your heart, as working for the Lord.&rdquo;
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">— Colossians 3:23</p>
        </div>
      </div>
    </AppLayout>
  );
}
