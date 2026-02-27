'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, max = 100, className, showLabel = true, size = 'md' }: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-[var(--text-muted)]">Progress</span>
          <span className="text-xs font-medium text-[var(--text-secondary)]">{percentage}%</span>
        </div>
      )}
      <div className={cn(
        'w-full rounded-full bg-[var(--bg-secondary)] overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2.5'
      )}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-[var(--accent)]"
        />
      </div>
    </div>
  );
}
