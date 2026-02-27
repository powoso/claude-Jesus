export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getStreakCount(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = [...dates]
    .map(d => new Date(d).toISOString().split('T')[0])
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .reverse();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diffDays = Math.round((current.getTime() - next.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  return Promise.resolve();
}

/**
 * SM-2 spaced repetition algorithm.
 * @param quality 0-5 rating (0-2 = fail, 3 = hard, 4 = good, 5 = easy)
 * @param prevInterval previous interval in days
 * @param prevEaseFactor previous ease factor
 * @returns { interval, easeFactor }
 */
export function sm2(quality: number, prevInterval: number, prevEaseFactor: number): { interval: number; easeFactor: number } {
  let interval: number;
  let easeFactor = prevEaseFactor;

  if (quality < 3) {
    // Failed — reset to beginning
    interval = 1;
  } else {
    if (prevInterval === 0) interval = 1;
    else if (prevInterval === 1) interval = 3;
    else interval = Math.round(prevInterval * easeFactor);
  }

  // Adjust ease factor (min 1.3)
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  return { interval, easeFactor };
}

/** Generate a date key like "2026-58" for a given date */
export function getDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${getDayOfYear(date)}`;
}

/** Check if a verse is due for review based on spaced repetition */
export function isDueForReview(lastReviewed: string, interval: number): boolean {
  const last = new Date(lastReviewed);
  const due = new Date(last.getTime() + interval * 86400000);
  return new Date() >= due;
}

export function getEncouragementMessage(trend: 'up' | 'down' | 'stable'): string {
  const upMessages = [
    "Wonderful growth! God is doing amazing things in your life.",
    "Keep pressing forward — your faithfulness is bearing fruit!",
    "What beautiful progress! May God continue to strengthen you.",
  ];
  const stableMessages = [
    "Consistency is a gift. Keep walking steadily with the Lord.",
    "Faithful in the everyday — that's where true growth happens.",
    "Standing firm is its own kind of victory. Well done!",
  ];
  const downMessages = [
    "Grace upon grace — every new day is a fresh start with God.",
    "Remember, God's love for you never changes. He's right here with you.",
    "Seasons of struggle are normal. God is refining you, not abandoning you.",
    "Be gentle with yourself — even Jesus rested. Tomorrow is full of new mercies.",
  ];

  const messages = trend === 'up' ? upMessages : trend === 'down' ? downMessages : stableMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}
