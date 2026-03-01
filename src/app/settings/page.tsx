'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Sun, Moon, Type, Download, Upload, Trash2,
  Check, AlertCircle, Info, Cloud, CloudOff, LogIn, LogOut,
  RefreshCw, Mail, Lock, UserPlus, Loader2, Bell, BellOff, Clock,
  Globe,
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { useApp } from '@/contexts/AppContext';
import { useSync } from '@/contexts/SyncContext';
import { useToast } from '@/components/ui/Toast';
import { useTranslation, LANGUAGES } from '@/lib/i18n';
import Link from 'next/link';

export default function SettingsPage() {
  const { settings, updateSettings, exportData, importData } = useApp();
  const sync = useSync();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const s = t.settings;
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  function friendlyError(msg: string): string {
    if (msg.includes('auth/invalid-email')) return s.invalidEmail;
    if (msg.includes('auth/user-not-found') || msg.includes('auth/invalid-credential')) return s.wrongPassword;
    if (msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) return s.wrongPassword;
    if (msg.includes('auth/email-already-in-use')) return s.emailInUse;
    if (msg.includes('auth/weak-password')) return s.weakPassword;
    if (msg.includes('auth/too-many-requests')) return s.tooManyAttempts;
    return msg;
  }

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
    showToast(s.dataExported);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importData(text);
      setImportStatus(success ? 'success' : 'error');
      showToast(success ? s.dataImported : s.importFailed, success ? 'success' : 'error');
      setTimeout(() => setImportStatus('idle'), 3000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearData = () => {
    if (confirm(s.clearConfirm)) {
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
        showToast(s.signedInSyncing);
      } else {
        await sync.signUp(email, password);
        showToast(s.accountCreated);
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
    showToast(s.signedOut);
  };

  const handleResetPassword = async () => {
    if (!email) { setAuthError(s.enterEmailFirst); return; }
    try {
      await sync.resetPassword(email);
      setResetSent(true);
      showToast(s.passwordReset);
    } catch {
      setAuthError(s.resetEmailFailed);
    }
  };

  const handleManualSync = async () => {
    const data = JSON.parse(exportData());
    delete data.exportDate;
    await sync.pushToCloud(data);
    showToast(s.dataSynced);
  };

  const syncStatusLabel: Record<string, string> = {
    idle: s.notConnected,
    syncing: s.syncing,
    synced: s.synced,
    error: s.syncError,
    offline: s.offline,
  };

  const syncStatusColor: Record<string, string> = {
    idle: 'text-[var(--text-muted)]',
    syncing: 'text-amber-500',
    synced: 'text-emerald-500',
    error: 'text-red-500',
    offline: 'text-[var(--text-muted)]',
  };

  const fontSizeLabels: Record<string, string> = {
    small: s.small,
    medium: s.medium,
    large: s.large,
  };

  return (
    <AppLayout>
      <PageHeader
        title={s.title}
        subtitle={s.subtitle}
        icon={<Settings size={28} />}
      />

      <div className="space-y-6 max-w-2xl">
        {/* Appearance */}
        <Card>
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-4">{s.appearance}</h2>

          {/* Dark Mode */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon size={18} className="text-[var(--accent)]" /> : <Sun size={18} className="text-[var(--accent)]" />}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{s.darkMode}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.darkModeDesc}</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.darkMode ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'
              }`}
              role="switch"
              aria-checked={settings.darkMode}
              aria-label={s.darkMode}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ left: settings.darkMode ? '26px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <Type size={18} className="text-[var(--accent)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{s.fontSize}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.fontSizeDesc}</p>
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
                  aria-label={`${s.fontSize}: ${fontSizeLabels[size]}`}
                >
                  {fontSizeLabels[size]}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-[var(--accent)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{s.language}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.languageDesc}</p>
              </div>
            </div>
            <div className="flex gap-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => updateSettings({ language: lang.value })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.language === lang.value
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                  aria-label={lang.label}
                >
                  {lang.native}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Daily Reminder */}
        <Card>
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-4">{s.dailyReminder}</h2>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              {settings.reminderEnabled ? <Bell size={18} className="text-[var(--accent)]" /> : <BellOff size={18} className="text-[var(--text-muted)]" />}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{s.notification}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.notificationDesc}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!settings.reminderEnabled) {
                  if ('Notification' in window && Notification.permission !== 'granted') {
                    const perm = await Notification.requestPermission();
                    if (perm !== 'granted') {
                      showToast(s.allowNotifications, 'error');
                      return;
                    }
                  }
                  updateSettings({ reminderEnabled: true });
                  const reg = await navigator.serviceWorker?.ready;
                  reg?.active?.postMessage({ type: 'SCHEDULE_REMINDER', time: settings.reminderTime });
                  showToast(s.reminderEnabled);
                } else {
                  updateSettings({ reminderEnabled: false });
                  const reg = await navigator.serviceWorker?.ready;
                  reg?.active?.postMessage({ type: 'CANCEL_REMINDER' });
                  showToast(s.reminderDisabled);
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.reminderEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'
              }`}
              role="switch"
              aria-checked={settings.reminderEnabled}
              aria-label={s.notification}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ left: settings.reminderEnabled ? '26px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Reminder Time */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-[var(--accent)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{s.reminderTime}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.reminderTimeDesc}</p>
              </div>
            </div>
            <input
              type="time"
              value={settings.reminderTime || '08:00'}
              onChange={async (e) => {
                updateSettings({ reminderTime: e.target.value });
                if (settings.reminderEnabled) {
                  const reg = await navigator.serviceWorker?.ready;
                  reg?.active?.postMessage({ type: 'SCHEDULE_REMINDER', time: e.target.value });
                }
              }}
              className="px-3 py-1.5 rounded-lg text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label={s.reminderTime}
            />
          </div>
        </Card>

        {/* Cloud Sync */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">{s.cloudSync}</h2>
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
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <CloudOff size={18} className="text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-secondary)]">{s.cloudNotConfigured}</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-xs text-[var(--text-muted)] space-y-2">
                <p className="font-medium text-[var(--text-secondary)]">{s.enableCloudSync}</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>{s.step1}</li>
                  <li>{s.step2}</li>
                  <li>{s.step3}</li>
                  <li>{s.step4}</li>
                  <li>{s.step5}</li>
                </ol>
              </div>
            </div>
          ) : sync.user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                  <Mail size={14} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{sync.user.email}</p>
                  <p className="text-xs text-[var(--text-muted)]">{s.signedInSync}</p>
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
                  {s.syncNow}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut size={14} />
                  {s.signOut}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">{s.signInDesc}</p>

              <form onSubmit={handleAuth} className="space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    placeholder={s.email}
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
                    placeholder={s.password}
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
                    {s.resetSent}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : authMode === 'signin' ? (
                    <><LogIn size={16} /> {s.signIn}</>
                  ) : (
                    <><UserPlus size={16} /> {s.createAccount}</>
                  )}
                </Button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(null); }}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {authMode === 'signin' ? s.createAccountLink : s.alreadyHaveAccount}
                  </button>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    >
                      {s.forgotPassword}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </Card>

        {/* Data Management */}
        <Card>
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-4">{s.dataManagement}</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{s.exportData}</p>
                  <p className="text-xs text-[var(--text-muted)]">{s.exportDataDesc}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download size={14} /> {s.export}
              </Button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Upload size={18} className="text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{s.importData}</p>
                  <p className="text-xs text-[var(--text-muted)]">{s.importDataDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {importStatus === 'success' && <Check size={14} className="text-emerald-500" />}
                {importStatus === 'error' && <AlertCircle size={14} className="text-red-500" />}
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> {s.import}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  aria-label={s.importData}
                />
              </div>
            </div>

            <div className="border-t border-[var(--border-color)] pt-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Trash2 size={18} className="text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{s.clearAllData}</p>
                    <p className="text-xs text-[var(--text-muted)]">{s.clearAllDataDesc}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearData}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} /> {s.clear}
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
                  {s.aboutDailyWalk}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{s.aboutDesc}</p>
              </div>
            </div>
          </Link>
        </Card>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="font-scripture text-sm text-[var(--text-muted)]">
            &ldquo;{s.footerVerse}&rdquo;
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{s.footerRef}</p>
        </div>
      </div>
    </AppLayout>
  );
}
