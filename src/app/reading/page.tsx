'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronRight, RotateCcw, Calendar, CheckSquare,
  Square, ArrowLeft, Flame
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/contexts/AppContext';
import { readingPlans } from '@/data/reading-plans';
import { formatShortDate } from '@/lib/utils';

export default function ReadingPage() {
  const { readingProgress, startPlan, toggleReadingDay, resetPlan } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const selectedPlan = selectedPlanId ? readingPlans.find(p => p.id === selectedPlanId) : null;
  const progress = selectedPlanId ? readingProgress.find(p => p.planId === selectedPlanId) : null;

  const completedCount = progress?.completedDays.length || 0;
  const totalDays = selectedPlan?.totalDays || 1;
  const percentage = Math.round((completedCount / totalDays) * 100);

  const estimatedCompletion = useMemo(() => {
    if (!progress || completedCount === 0) return null;
    const remaining = totalDays - completedCount;
    const daysActive = Math.max(1, Math.ceil((Date.now() - new Date(progress.startDate).getTime()) / 86400000));
    const pace = completedCount / daysActive;
    if (pace === 0) return null;
    const daysToComplete = Math.ceil(remaining / pace);
    const est = new Date();
    est.setDate(est.getDate() + daysToComplete);
    return formatShortDate(est);
  }, [progress, completedCount, totalDays]);

  // Calculate streak for active plan
  const streak = useMemo(() => {
    if (!progress) return 0;
    const sortedDays = [...progress.completedDays].sort((a, b) => b - a);
    if (sortedDays.length === 0) return 0;
    let s = 1;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      if (sortedDays[i] - sortedDays[i + 1] === 1) s++;
      else break;
    }
    return s;
  }, [progress]);

  if (selectedPlan) {
    return (
      <AppLayout>
        <div className="mb-6">
          <button
            onClick={() => setSelectedPlanId(null)}
            className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
          >
            <ArrowLeft size={16} /> Back to Plans
          </button>

          <PageHeader
            title={selectedPlan.name}
            subtitle={selectedPlan.description}
            icon={<BookOpen size={28} />}
            action={
              progress ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Reset all progress for this plan?')) resetPlan(selectedPlan.id);
                  }}
                >
                  <RotateCcw size={14} /> Reset
                </Button>
              ) : (
                <Button onClick={() => startPlan(selectedPlan.id)}>Start Plan</Button>
              )
            }
          />
        </div>

        {progress && (
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">{completedCount}</span> of {totalDays} days completed
                </p>
                {estimatedCompletion && (
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                    <Calendar size={12} /> Estimated completion: {estimatedCompletion}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {streak > 1 && (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Flame size={14} />
                    <span className="text-xs font-semibold">{streak} day streak</span>
                  </div>
                )}
              </div>
            </div>
            <ProgressBar value={completedCount} max={totalDays} />
          </Card>
        )}

        {!progress && (
          <Card className="mb-6 text-center py-8">
            <p className="text-[var(--text-muted)] mb-4">Ready to begin this reading plan?</p>
            <Button onClick={() => startPlan(selectedPlan.id)}>Start Reading</Button>
          </Card>
        )}

        <div className="space-y-2">
          {selectedPlan.readings.map((reading) => {
            const isCompleted = progress?.completedDays.includes(reading.day);
            return (
              <motion.div
                key={reading.day}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reading.day * 0.01 }}
              >
                <button
                  onClick={() => progress && toggleReadingDay(selectedPlan.id, reading.day)}
                  disabled={!progress}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    isCompleted
                      ? 'bg-[var(--accent)]/5 border-[var(--accent)]/20'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent)]/30'
                  } ${!progress ? 'opacity-60' : ''}`}
                  aria-label={`Day ${reading.day}: ${reading.title}${isCompleted ? ' (completed)' : ''}`}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckSquare size={20} className="text-[var(--accent)]" />
                    ) : (
                      <Square size={20} className="text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Day {reading.day}</span>
                      <span className="text-xs text-[var(--border-color)]">•</span>
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">{reading.title}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {reading.passages.join(' • ')}
                    </p>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Bible Reading Plans"
        subtitle="All Scripture is God-breathed and useful for teaching."
        icon={<BookOpen size={28} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {readingPlans.map((plan, i) => {
          const planProgress = readingProgress.find(p => p.planId === plan.id);
          const pComplete = planProgress ? Math.round((planProgress.completedDays.length / plan.totalDays) * 100) : 0;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card hover onClick={() => setSelectedPlanId(plan.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{plan.duration}</p>
                  </div>
                  <ChevronRight size={18} className="text-[var(--text-muted)] mt-1" />
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">{plan.description}</p>
                {planProgress ? (
                  <ProgressBar value={planProgress.completedDays.length} max={plan.totalDays} size="sm" />
                ) : (
                  <Badge variant="info">Not started</Badge>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
}
