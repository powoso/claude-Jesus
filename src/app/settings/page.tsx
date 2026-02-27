'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Sun, Moon, Type, Download, Upload, Trash2,
  Check, AlertCircle, Info
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { useApp } from '@/contexts/AppContext';
import Link from 'next/link';

export default function SettingsPage() {
  const { settings, updateSettings, exportData, importData } = useApp();
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importData(text);
      setImportStatus(success ? 'success' : 'error');
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
