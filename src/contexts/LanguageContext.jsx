"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { HINDI } from '@/constants/hindi';

/**
 * Interface language (English / Hindi).
 *
 * `t('Submit')` returns the Hindi text when Hindi is selected and a
 * translation exists; otherwise it returns the English text it was given, so
 * a screen that is not translated yet simply stays in English.
 *
 * `t('{count} reports', { count: 3 })` fills placeholders in either language.
 */

const STORAGE_KEY = 'sarra.language';
const LanguageContext = createContext({ language: 'en', setLanguage: () => {}, t: (text) => text });

const fill = (text, values) => (values ? text.replace(/\{(\w+)\}/g, (match, key) => (values[key] ?? match)) : text);

export function LanguageProvider({ children }) {
  // Always start in English so the server and the first client render match.
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi') setLanguageState('hi');
    } catch { /* storage unavailable: stay in English */ }
  }, []);

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  const setLanguage = useCallback((next) => {
    const value = next === 'hi' ? 'hi' : 'en';
    setLanguageState(value);
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch { /* not saved; applies for this visit */ }
  }, []);

  const t = useCallback((text, values) => {
    if (typeof text !== 'string') return text;
    return fill(language === 'hi' ? (HINDI[text] || text) : text, values);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
/** Shorthand for components that only translate. */
export const useT = () => useContext(LanguageContext).t;

/** English / हिंदी switch for the top bar. */
export function LanguageToggle({ className = '', tone = 'dark' }) {
  const { language, setLanguage } = useLanguage();
  const light = tone === 'light';
  return (
    <div role="group" aria-label="Language / भाषा" className={`inline-flex overflow-hidden rounded-lg border text-xs font-semibold ${light ? 'border-slate-200 bg-white' : 'border-blue-400/40'} ${className}`}>
      {[['en', 'English', 'EN'], ['hi', 'हिंदी', 'हिं']].map(([code, name, short]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={language === code}
          aria-label={name}
          title={name}
          onClick={() => setLanguage(code)}
          className={`px-2.5 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${light ? (language === code ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100') : (language === code ? 'bg-white text-navy' : 'text-blue-100 hover:bg-blue-700')} ${light ? 'focus-visible:ring-navy/50' : ''}`}
        >
          {short}
        </button>
      ))}
    </div>
  );
}
