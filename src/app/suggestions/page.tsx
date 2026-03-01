'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircleHeart,
  Send,
  Lightbulb,
  Bug,
  Heart,
  MessageSquare,
  Check,
  Trash2,
  Mail,
} from 'lucide-react';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/components/ui/Toast';

interface Suggestion {
  id: string;
  category: string;
  message: string;
  email: string;
  date: string;
}

const categories = [
  { id: 'feature', label: 'Feature Idea', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400' },
  { id: 'prayer', label: 'Prayer Request', icon: Heart, color: 'text-pink-500' },
  { id: 'general', label: 'General Feedback', icon: MessageSquare, color: 'text-[var(--accent)]' },
];

export default function SuggestionsPage() {
  const { showToast } = useToast();
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('daily-walk-suggestions');
    if (stored) {
      try { setSuggestions(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newSuggestion: Suggestion = {
      id: Date.now().toString(),
      category,
      message: message.trim(),
      email: email.trim(),
      date: new Date().toISOString(),
    };

    const updated = [newSuggestion, ...suggestions];
    setSuggestions(updated);
    localStorage.setItem('daily-walk-suggestions', JSON.stringify(updated));

    setMessage('');
    setEmail('');
    setSubmitted(true);
    showToast('Thank you for your feedback!');
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = suggestions.filter(s => s.id !== id);
    setSuggestions(updated);
    localStorage.setItem('daily-walk-suggestions', JSON.stringify(updated));
    showToast('Suggestion removed');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const getCategoryInfo = (id: string) => categories.find(c => c.id === id) || categories[3];

  return (
    <AppLayout>
      <PageHeader
        title="Suggestions & Contact"
        subtitle="We'd love to hear from you."
        icon={<MessageCircleHeart size={28} />}
      />

      <div className="max-w-2xl space-y-6">
        {/* Intro */}
        <Card>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Have an idea to make Daily Walk better? Found something that isn&apos;t working right?
            Or simply want to share how God is using this app in your life? We&apos;d love to hear
            from you. Every piece of feedback helps us serve you and the body of Christ better.
          </p>
        </Card>

        {/* Contact Email */}
        <Card>
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">
            Get in Touch
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
            You can reach us directly by email. We read every message and will do our best to respond.
          </p>
          <a
            href="mailto:maranatha11111@proton.me"
            className="flex items-center gap-3 p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/15 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Email Us</p>
              <p className="text-xs text-[var(--text-muted)]">maranatha11111@proton.me</p>
            </div>
          </a>
        </Card>

        {/* Form */}
        <Card>
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-4">
            Share Your Thoughts
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => {
                  const isActive = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                        isActive
                          ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      <cat.icon size={16} className={isActive ? cat.color : ''} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="suggestion-message" className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Your Message
              </label>
              <textarea
                id="suggestion-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  category === 'feature' ? 'Describe the feature you\'d love to see...' :
                  category === 'bug' ? 'What happened? What did you expect to happen?' :
                  category === 'prayer' ? 'Share your prayer request — we\'ll lift it up...' :
                  'Share your thoughts, encouragement, or feedback...'
                }
                rows={5}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm leading-relaxed resize-none"
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label htmlFor="suggestion-email" className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Your Email <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="suggestion-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com — if you'd like a response"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 text-emerald-600"
                >
                  <Check size={18} />
                  <span className="text-sm font-medium">Thank you! Your message has been saved.</span>
                </motion.div>
              ) : (
                <motion.div key="button" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Button type="submit" className="w-full" disabled={!message.trim()}>
                    <Send size={16} />
                    Send Feedback
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Card>

        {/* Previous Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">
              Your Previous Messages
            </h2>
            <div className="space-y-3">
              {suggestions.map((s, i) => {
                const cat = getCategoryInfo(s.category);
                const CatIcon = cat.icon;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CatIcon size={14} className={cat.color} />
                          <span className="text-xs font-medium text-[var(--text-muted)]">{cat.label}</span>
                          <span className="text-xs text-[var(--text-muted)]">&middot;</span>
                          <span className="text-xs text-[var(--text-muted)]">{formatDate(s.date)}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                          aria-label="Delete suggestion"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {s.message}
                      </p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scripture footer */}
        <div className="text-center py-8">
          <p className="font-scripture text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            &ldquo;Therefore encourage one another and build each other up, just as in fact you are doing.&rdquo;
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">— 1 Thessalonians 5:11</p>
        </div>
      </div>
    </AppLayout>
  );
}
