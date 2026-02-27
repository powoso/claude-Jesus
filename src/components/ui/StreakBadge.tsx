'use client';

import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  count: number;
  label?: string;
  className?: string;
}

export function StreakBadge({ count, label = 'day streak', className }: StreakBadgeProps) {
  if (count === 0) return null;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
      'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
      className
    )}>
      <Flame size={14} className="text-amber-500" />
      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
        {count} {label}
      </span>
    </div>
  );
}
