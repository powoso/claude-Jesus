'use client';

import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  scripture?: { text: string; reference: string };
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, scripture, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {icon && (
        <div className="mb-4 text-[var(--text-muted)] opacity-50">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-sm mb-4">{description}</p>
      {scripture && (
        <p className="font-scripture text-sm text-[var(--accent)] max-w-md mb-6">
          &ldquo;{scripture.text}&rdquo;
          <span className="block mt-1 not-italic text-xs text-[var(--text-muted)]">— {scripture.reference}</span>
        </p>
      )}
      {action}
    </motion.div>
  );
}
