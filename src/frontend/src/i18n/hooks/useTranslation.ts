import { useTranslation as useI18nextTranslation } from 'react-i18next';
import type { 
  TranslationNamespace, 
  LanguageCode, 
  UseTranslationReturn,
  TFunction,
  TranslationOptions
} from '../types';

/**
 * Custom useTranslation hook with enhanced TypeScript support
 * 
 * @param ns - Translation namespace(s) to load
 * @param options - Additional options for the hook
 * @returns Enhanced translation function and i18n instance
 */
export function useTranslation(
  ns?: TranslationNamespace | TranslationNamespace[],
  options?: {
    keyPrefix?: string;
    useSuspense?: boolean;
  }
): UseTranslationReturn {
  const { t: originalT, i18n, ready } = useI18nextTranslation(ns, options);

  // Enhanced translation function with better type safety
  const t: TFunction = (key: string, options?: TranslationOptions) => {
    return originalT(key, options as any) as string;
  };

  // Enhanced i18n object with typed methods
  const enhancedI18n = {
    ...i18n,
    language: i18n.language as LanguageCode,
    languages: i18n.languages as LanguageCode[],
    
    changeLanguage: async (lng: LanguageCode): Promise<TFunction> => {
      await i18n.changeLanguage(lng);
      return t;
    },
    
    exists: (key: string, options?: { ns?: TranslationNamespace }): boolean => {
      return i18n.exists(key, options);
    },
    
    getFixedT: (lng?: LanguageCode, ns?: TranslationNamespace): TFunction => {
      const fixedT = i18n.getFixedT(lng || i18n.language, ns);
      return (key: string, options?: TranslationOptions) => fixedT(key, options as any) as string;
    },
    
    hasResourceBundle: (lng: LanguageCode, ns: TranslationNamespace): boolean => {
      return i18n.hasResourceBundle(lng, ns);
    },
    
    loadNamespaces: async (ns: TranslationNamespace | TranslationNamespace[]): Promise<void> => {
      return i18n.loadNamespaces(ns);
    },
    
    loadLanguages: async (lngs: LanguageCode | LanguageCode[]): Promise<void> => {
      return i18n.loadLanguages(lngs);
    },
    
    reloadResources: async (
      lngs?: LanguageCode | LanguageCode[],
      ns?: TranslationNamespace | TranslationNamespace[]
    ): Promise<void> => {
      return i18n.reloadResources(lngs, ns);
    }
  };

  return {
    t,
    i18n: enhancedI18n,
    ready
  };
}

/**
 * Hook for using translations with a specific namespace
 * 
 * @param ns - The namespace to use
 * @returns Translation function scoped to the namespace
 */
export function useNamespacedTranslation(ns: TranslationNamespace) {
  const { t, i18n, ready } = useTranslation(ns);
  
  // Create a scoped translation function
  const scopedT = (key: string, options?: Omit<TranslationOptions, 'ns'>) => {
    return t(key, { ...options, ns });
  };
  
  return {
    t: scopedT,
    i18n,
    ready
  };
}

/**
 * Hook for getting translation functions for multiple namespaces
 * 
 * @param namespaces - Array of namespaces to load
 * @returns Object with translation functions for each namespace
 */
export function useMultipleTranslations(namespaces: TranslationNamespace[]) {
  const { t, i18n, ready } = useTranslation(namespaces);
  
  // Create scoped translation functions for each namespace
  const translations = namespaces.reduce((acc, ns) => {
    acc[ns] = (key: string, options?: Omit<TranslationOptions, 'ns'>) => {
      return t(key, { ...options, ns });
    };
    return acc;
  }, {} as Record<TranslationNamespace, (key: string, options?: Omit<TranslationOptions, 'ns'>) => string>);
  
  return {
    t: translations,
    i18n,
    ready
  };
}

/**
 * Hook for language switching functionality
 * 
 * @returns Language switching utilities
 */
export function useLanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.language as LanguageCode;
  // Use predefined languages instead of relying on i18n.languages
  const availableLanguages: LanguageCode[] = ['en', 'vi'];
  
  const switchLanguage = async (language: LanguageCode) => {
    try {
      await i18n.changeLanguage(language);
      // Store the selected language in localStorage
      localStorage.setItem('i18nextLng', language);
    } catch (error) {
      console.error('Failed to switch language:', error);
      throw error;
    }
  };
  
  const getLanguageName = (code: LanguageCode): string => {
    const languageNames: Record<LanguageCode, string> = {
      en: 'English',
      vi: 'Tiếng Việt'
    };
    return languageNames[code] || code;
  };
  
  return {
    currentLanguage,
    availableLanguages,
    switchLanguage,
    getLanguageName
  };
}

/**
 * Hook for checking if translations are ready
 * 
 * @param requiredNamespaces - Namespaces that must be loaded
 * @returns Boolean indicating if all required translations are ready
 */
export function useTranslationReady(requiredNamespaces?: TranslationNamespace[]) {
  const { i18n, ready } = useTranslation();
  
  if (!requiredNamespaces) {
    return ready;
  }
  
  // Check if all required namespaces are loaded
  const allNamespacesReady = requiredNamespaces.every(ns => 
    i18n.hasResourceBundle(i18n.language as LanguageCode, ns)
  );
  
  return ready && allNamespacesReady;
}

/**
 * Hook for formatting numbers, dates, and currencies with localization
 * 
 * @returns Formatting utilities
 */
export function useLocalization() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as LanguageCode;
  
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
  };
  
  const formatCurrency = (value: number, currency: string = 'VND') => {
    const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(value);
  };
  
  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  };
  
  const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit) => {
    const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
  };
  
  return {
    currentLanguage,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime
  };
}

// Re-export the original hook for backward compatibility
export { useTranslation as useI18nextTranslation } from 'react-i18next';