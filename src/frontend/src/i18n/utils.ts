import type { LanguageCode, TranslationNamespace } from './types';
import i18n from './config';

/**
 * Get the current language
 */
export function getCurrentLanguage(): LanguageCode {
  return i18n.language as LanguageCode;
}

/**
 * Check if a language is supported
 */
export function isSupportedLanguage(lang: string): lang is LanguageCode {
  return ['en', 'vi'].includes(lang);
}

/**
 * Get the display name for a language
 */
export function getLanguageDisplayName(lang: LanguageCode): string {
  const names: Record<LanguageCode, string> = {
    en: 'English',
    vi: 'Tiếng Việt'
  };
  return names[lang] || lang;
}

/**
 * Get the native display name for a language
 */
export function getLanguageNativeName(lang: LanguageCode): string {
  const names: Record<LanguageCode, string> = {
    en: 'English',
    vi: 'Tiếng Việt'
  };
  return names[lang] || lang;
}

/**
 * Switch language and persist the choice
 */
export async function switchLanguage(language: LanguageCode): Promise<void> {
  try {
    await i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  } catch (error) {
    console.error('Failed to switch language:', error);
    throw error;
  }
}

/**
 * Get the stored language preference
 */
export function getStoredLanguage(): LanguageCode | null {
  const stored = localStorage.getItem('i18nextLng');
  return stored && isSupportedLanguage(stored) ? stored : null;
}

/**
 * Detect browser language and return supported language or fallback
 */
export function detectBrowserLanguage(): LanguageCode {
  const browserLang = navigator.language.split('-')[0];
  return isSupportedLanguage(browserLang) ? browserLang : 'en';
}

/**
 * Check if a translation key exists
 */
export function translationExists(
  key: string, 
  namespace?: TranslationNamespace,
  language?: LanguageCode
): boolean {
  return i18n.exists(key, { 
    ns: namespace,
    lng: language || getCurrentLanguage()
  });
}

/**
 * Get translation without React hook (for use outside components)
 */
export function translate(
  key: string,
  options?: {
    ns?: TranslationNamespace;
    defaultValue?: string;
    count?: number;
    context?: string;
    replace?: Record<string, string | number>;
    lng?: LanguageCode;
  }
): string {
  return i18n.t(key, options);
}

/**
 * Get multiple translations at once
 */
export function translateMultiple(
  keys: string[],
  options?: {
    ns?: TranslationNamespace;
    lng?: LanguageCode;
  }
): Record<string, string> {
  return keys.reduce((acc, key) => {
    acc[key] = translate(key, options);
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Format a number according to current locale
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getCurrentLanguage() === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency according to current locale
 */
export function formatCurrency(
  value: number,
  currency: string = 'VND'
): string {
  const locale = getCurrentLanguage() === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(value);
}

/**
 * Format date according to current locale
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getCurrentLanguage() === 'vi' ? 'vi-VN' : 'en-US';
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format relative time according to current locale
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit
): string {
  const locale = getCurrentLanguage() === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
}

/**
 * Get time ago string using translations
 */
export function getTimeAgo(date: Date | string | number): string {
  const now = new Date();
  const targetDate = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return translate('common:time.now');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return translate('common:time.minutes_ago', { count: diffInMinutes });
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return translate('common:time.hours_ago', { count: diffInHours });
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return translate('common:time.days_ago', { count: diffInDays });
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return translate('common:time.weeks_ago', { count: diffInWeeks });
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return translate('common:time.months_ago', { count: diffInMonths });
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return translate('common:time.years_ago', { count: diffInYears });
}

/**
 * Pluralize a translation key based on count
 */
export function pluralize(
  key: string,
  count: number,
  options?: {
    ns?: TranslationNamespace;
    lng?: LanguageCode;
  }
): string {
  return translate(key, { ...options, count });
}

/**
 * Get direction for current language (for RTL support in future)
 */
export function getLanguageDirection(lang?: LanguageCode): 'ltr' | 'rtl' {
  const language = lang || getCurrentLanguage();
  // Currently all supported languages are LTR
  // Add RTL languages here when needed
  const rtlLanguages: LanguageCode[] = [];
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
}

/**
 * Load additional namespaces dynamically
 */
export async function loadNamespaces(
  namespaces: TranslationNamespace | TranslationNamespace[]
): Promise<void> {
  try {
    await i18n.loadNamespaces(namespaces);
  } catch (error) {
    console.error('Failed to load namespaces:', error);
    throw error;
  }
}

/**
 * Preload translations for a specific language
 */
export async function preloadLanguage(language: LanguageCode): Promise<void> {
  try {
    await i18n.loadLanguages(language);
  } catch (error) {
    console.error('Failed to preload language:', error);
    throw error;
  }
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): LanguageCode[] {
  return ['en', 'vi'];
}

/**
 * Check if i18n is initialized and ready
 */
export function isI18nReady(): boolean {
  return i18n.isInitialized;
}

/**
 * Get current namespace
 */
export function getCurrentNamespace(): TranslationNamespace {
  return (i18n.options.defaultNS as TranslationNamespace) || 'common';
}