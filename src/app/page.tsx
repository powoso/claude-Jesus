'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Cross,
  BookHeart,
  BookOpen,
  Brain,
  Heart,
  TrendingUp,
  Home,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';

const features = [
  { icon: Home, title: 'Daily Devotionals', description: 'Start each day with God\'s Word and reflective questions.' },
  { icon: BookHeart, title: 'Prayer Journal', description: 'Pour out your heart and track God\'s faithfulness.' },
  { icon: BookOpen, title: 'Reading Plans', description: 'Journey through Scripture with structured reading plans.' },
  { icon: Brain, title: 'Scripture Memory', description: 'Hide God\'s Word in your heart with practice tools.' },
  { icon: Heart, title: 'Gratitude Wall', description: 'Capture moments of praise and thankfulness.' },
  { icon: TrendingUp, title: 'Growth Tracker', description: 'Reflect on your spiritual journey with gentle check-ins.' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const router = useRouter();
  const { settings, updateSettings, isHydrated } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHydrated && settings.hasVisitedBefore) {
      router.replace('/devotional');
    }
  }, [isHydrated, settings.hasVisitedBefore, router]);

  const handleBeginWalk = () => {
    updateSettings({ hasVisitedBefore: true });
    router.push('/devotional');
  };

  if (!mounted || !isHydrated || settings.hasVisitedBefore) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center animate-pulse">
          <Cross size={16} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* Gradient background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent)] rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-gold)] rounded-full blur-[128px]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-6 shadow-lg">
            <Cross size={36} className="text-white" />
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
            Daily Walk
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-2xl mx-auto mb-10"
        >
          <blockquote className="font-scripture text-xl sm:text-2xl text-[var(--text-secondary)] mb-4 leading-relaxed">
            &ldquo;I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life.&rdquo;
          </blockquote>
          <p className="text-sm text-[var(--text-muted)] font-medium">— John 8:12</p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-[var(--text-muted)] mb-10 max-w-md"
        >
          Your personal space to grow closer to Jesus, one day at a time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button size="lg" onClick={handleBeginWalk} className="text-base">
            Begin Your Walk
            <ArrowRight size={18} />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-6 h-10 rounded-full border-2 border-[var(--border-color)] flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-[var(--text-muted)]" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Tools for Your Journey
            </h2>
            <p className="text-[var(--text-muted)] max-w-lg mx-auto">
              Everything you need to nurture your relationship with Christ in one beautiful, distraction-free space.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="card p-8 text-center"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
                  <feature.icon size={22} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-[var(--border-color)]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--accent)] flex items-center justify-center mb-4">
            <Cross size={18} className="text-white" />
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Built with love for the glory of God
          </p>
          <p className="font-scripture text-sm text-[var(--accent)]">
            &ldquo;For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.&rdquo;
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-2">— John 3:16</p>
        </div>
      </footer>
    </div>
  );
}
