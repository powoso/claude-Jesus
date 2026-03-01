import { useApp } from '@/contexts/AppContext';
import en, { type Translations } from './en';
import es from './es';
import zh from './zh';

export type Language = 'en' | 'es' | 'zh';

export const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'es', label: 'Spanish', native: 'Español' },
  { value: 'zh', label: 'Chinese', native: '中文' },
];

const translations: Record<Language, Translations> = { en, es, zh };

export function useTranslation() {
  const { settings } = useApp();
  const lang = (settings.language as Language) || 'en';
  const t = translations[lang] || en;
  return { t, lang };
}

/** Get the locale string for date formatting (e.g. 'en-US', 'es-ES', 'zh-CN') */
export function getLocale(lang: Language): string {
  switch (lang) {
    case 'es': return 'es-ES';
    case 'zh': return 'zh-CN';
    default: return 'en-US';
  }
}

export type { Translations };
