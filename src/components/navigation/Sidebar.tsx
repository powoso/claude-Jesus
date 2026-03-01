'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookHeart,
  BookOpen,
  Brain,
  Heart,
  TrendingUp,
  Settings,
  Info,
  Menu,
  X,
  PenLine,
  Search,
  CloudCheck,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useSync } from '@/contexts/SyncContext';

const navItems = [
  { href: '/devotional', label: 'Devotional', icon: Home },
  { href: '/journal', label: 'Journal', icon: PenLine },
  { href: '/prayer', label: 'Prayer Journal', icon: BookHeart },
  { href: '/reading', label: 'Reading Plans', icon: BookOpen },
  { href: '/memory', label: 'Scripture Memory', icon: Brain },
  { href: '/search', label: 'Bible Search', icon: Search },
  { href: '/gratitude', label: 'Gratitude Wall', icon: Heart },
  { href: '/growth', label: 'Growth Tracker', icon: TrendingUp },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/about', label: 'About', icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { lastSaved } = useApp();
  const { user, syncStatus } = useSync();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[var(--bg-card)] border-r border-[var(--border-color)] z-40">
        <div className="p-6 border-b border-[var(--border-color)]">
          <Link href="/devotional" className="flex items-center gap-2.5">
            <Image src="/favicon.svg" alt="Daily Walk" width={32} height={32} className="rounded-lg" />
            <span className="font-heading text-xl font-bold text-[var(--text-primary)]">Daily Walk</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border-color)] space-y-1">
          {/* Sync / save indicator */}
          {user ? (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-muted)]">
              {syncStatus === 'syncing' ? (
                <><Loader2 size={14} className="text-amber-500 animate-spin" /><span>Syncing...</span></>
              ) : syncStatus === 'synced' ? (
                <><Cloud size={14} className="text-emerald-500" /><span>Synced to cloud</span></>
              ) : syncStatus === 'error' ? (
                <><CloudOff size={14} className="text-red-500" /><span>Sync error</span></>
              ) : (
                <><Cloud size={14} /><span>Cloud connected</span></>
              )}
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-muted)]">
              <CloudCheck size={14} className="text-emerald-500" />
              <span>Saved locally</span>
            </div>
          ) : null}
          {bottomItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--bg-card)] border-b border-[var(--border-color)] z-50 flex items-center justify-between px-4">
        <Link href="/devotional" className="flex items-center gap-2">
          <Image src="/favicon.svg" alt="Daily Walk" width={28} height={28} className="rounded-lg" />
          <span className="font-heading text-lg font-bold text-[var(--text-primary)]">Daily Walk</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/30 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed right-0 top-14 bottom-0 w-64 bg-[var(--bg-card)] border-l border-[var(--border-color)] z-50 p-4"
            >
              <nav className="space-y-1" aria-label="Mobile navigation">
                {[...navItems, ...bottomItems].map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                      )}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] z-40 safe-bottom" aria-label="Bottom navigation">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 6).map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors',
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors',
              pathname === '/settings' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
            )}
          >
            <Settings size={20} />
            <span className="text-[10px] font-medium">More</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
