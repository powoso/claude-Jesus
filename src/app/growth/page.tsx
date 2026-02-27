'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Plus, Calendar, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/contexts/AppContext';
import { getWeekNumber, getEncouragementMessage } from '@/lib/utils';

const categories = [
  { key: 'prayerLife', label: 'Prayer Life' },
  { key: 'scriptureReading', label: 'Scripture Reading' },
  { key: 'worship', label: 'Worship' },
  { key: 'service', label: 'Service' },
  { key: 'fellowship', label: 'Fellowship' },
] as const;

export default function GrowthPage() {
  const { weeklyCheckIns, addWeeklyCheckIn } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [ratings, setRatings] = useState({
    prayerLife: 3,
    scriptureReading: 3,
    worship: 3,
    service: 3,
    fellowship: 3,
  });

  // Chart data
  const chartData = useMemo(() => {
    return [...weeklyCheckIns]
      .reverse()
      .slice(-12)
      .map(c => ({
        week: `W${c.weekNumber}`,
        ...c.ratings,
        average: Object.values(c.ratings).reduce((a, b) => a + b, 0) / 5,
      }));
  }, [weeklyCheckIns]);

  // Radar data for latest check-in
  const radarData = useMemo(() => {
    const latest = weeklyCheckIns[0];
    if (!latest) return [];
    return categories.map(cat => ({
      category: cat.label,
      value: latest.ratings[cat.key],
    }));
  }, [weeklyCheckIns]);

  // Trend analysis
  const trend = useMemo((): 'up' | 'down' | 'stable' => {
    if (weeklyCheckIns.length < 2) return 'stable';
    const recent = weeklyCheckIns.slice(0, 3);
    const avgRecent = recent.reduce((sum, c) =>
      sum + Object.values(c.ratings).reduce((a, b) => a + b, 0) / 5, 0) / recent.length;
    const older = weeklyCheckIns.slice(3, 6);
    if (older.length === 0) return 'stable';
    const avgOlder = older.reduce((sum, c) =>
      sum + Object.values(c.ratings).reduce((a, b) => a + b, 0) / 5, 0) / older.length;
    if (avgRecent > avgOlder + 0.3) return 'up';
    if (avgRecent < avgOlder - 0.3) return 'down';
    return 'stable';
  }, [weeklyCheckIns]);

  const encouragement = useMemo(() => getEncouragementMessage(trend), [trend]);

  const handleSubmitCheckIn = () => {
    const now = new Date();
    addWeeklyCheckIn({
      date: now.toISOString(),
      weekNumber: getWeekNumber(now),
      year: now.getFullYear(),
      ratings,
    });
    setRatings({ prayerLife: 3, scriptureReading: 3, worship: 3, service: 3, fellowship: 3 });
    setShowAddModal(false);
  };

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const thisMonth = weeklyCheckIns.filter(c => {
      const d = new Date(c.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    if (thisMonth.length === 0) return null;
    const avg = categories.map(cat => ({
      label: cat.label,
      avg: Number((thisMonth.reduce((sum, c) => sum + c.ratings[cat.key], 0) / thisMonth.length).toFixed(1)),
    }));
    return { checkIns: thisMonth.length, averages: avg };
  }, [weeklyCheckIns]);

  return (
    <AppLayout>
      <PageHeader
        title="Spiritual Growth"
        subtitle="But grow in the grace and knowledge of our Lord."
        icon={<TrendingUp size={28} />}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Weekly Check-In
          </Button>
        }
      />

      {weeklyCheckIns.length === 0 ? (
        <EmptyState
          icon={<TrendingUp size={48} />}
          title="Start tracking your growth"
          description="Complete your first weekly check-in to begin seeing your spiritual growth journey."
          scripture={{
            text: 'Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.',
            reference: 'Philippians 1:6',
          }}
          action={
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              First Check-In
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Encouragement */}
          <Card className="bg-[var(--accent)]/5 border-[var(--accent)]/20">
            <p className="font-scripture text-[var(--text-primary)] text-center">
              {encouragement}
            </p>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart */}
            <Card>
              <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <BarChart2 size={18} /> Growth Trends
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Line type="monotone" dataKey="average" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4 }} name="Average" />
                    <Line type="monotone" dataKey="prayerLife" stroke="#7C9070" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Prayer" />
                    <Line type="monotone" dataKey="scriptureReading" stroke="#C9A84C" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Scripture" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Radar Chart */}
            <Card>
              <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-4">Latest Check-In</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Monthly Summary */}
          {monthlySummary && (
            <Card>
              <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Calendar size={18} /> This Month&apos;s Summary
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                {monthlySummary.checkIns} check-in{monthlySummary.checkIns !== 1 ? 's' : ''} this month
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {monthlySummary.averages.map(item => (
                  <div key={item.label} className="text-center">
                    <div className="text-2xl font-bold text-[var(--accent)]">{item.avg}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* History */}
          <Card>
            <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-4">Check-In History</h3>
            <div className="space-y-3">
              {weeklyCheckIns.slice(0, 10).map((checkIn, i) => {
                const avg = (Object.values(checkIn.ratings).reduce((a, b) => a + b, 0) / 5).toFixed(1);
                return (
                  <motion.div
                    key={checkIn.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0"
                  >
                    <div>
                      <span className="text-sm text-[var(--text-primary)]">Week {checkIn.weekNumber}, {checkIn.year}</span>
                      <span className="text-xs text-[var(--text-muted)] ml-2">
                        {new Date(checkIn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--accent)]">{avg}/5</span>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Check-In Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Weekly Check-In">
        <div className="space-y-5">
          <p className="text-sm text-[var(--text-muted)]">
            Reflect on your week. Rate each area from 1 to 5 — be honest and gentle with yourself.
          </p>
          {categories.map(cat => (
            <div key={cat.key}>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {cat.label}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRatings(prev => ({ ...prev, [cat.key]: n }))}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                      ratings[cat.key] === n
                        ? 'bg-[var(--accent)] text-white scale-110'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                    aria-label={`Rate ${cat.label} ${n} out of 5`}
                  >
                    {n}
                  </button>
                ))}
                <span className="text-xs text-[var(--text-muted)] ml-2">
                  {ratings[cat.key] === 1 ? 'Needs growth' :
                   ratings[cat.key] === 2 ? 'Developing' :
                   ratings[cat.key] === 3 ? 'Steady' :
                   ratings[cat.key] === 4 ? 'Strong' : 'Thriving'}
                </span>
              </div>
            </div>
          ))}
          <Button onClick={handleSubmitCheckIn} className="w-full">
            Submit Check-In
          </Button>
          <p className="font-scripture text-xs text-center text-[var(--text-muted)]">
            &ldquo;He who began a good work in you will carry it on to completion.&rdquo; — Philippians 1:6
          </p>
        </div>
      </Modal>
    </AppLayout>
  );
}
