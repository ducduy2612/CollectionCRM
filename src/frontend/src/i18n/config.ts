import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation resources
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enNavigation from './locales/en/navigation.json';
import enCustomers from './locales/en/customers.json';
import enDashboard from './locales/en/dashboard.json';
import enSettings from './locales/en/settings.json';
import enForms from './locales/en/forms.json';
import enTables from './locales/en/tables.json';
import enErrors from './locales/en/errors.json';

import viCommon from './locales/vi/common.json';
import viAuth from './locales/vi/auth.json';
import viNavigation from './locales/vi/navigation.json';
import viCustomers from './locales/vi/customers.json';
import viDashboard from './locales/vi/dashboard.json';
import viSettings from './locales/vi/settings.json';
import viForms from './locales/vi/forms.json';
import viTables from './locales/vi/tables.json';
import viErrors from './locales/vi/errors.json';

// Define available languages
export const LANGUAGES = {
  en: 'English',
  vi: 'Tiếng Việt'
} as const;

export const DEFAULT_LANGUAGE = 'en';
export const FALLBACK_LANGUAGE = 'en';

// Define namespaces
export const NAMESPACES = [
  'common',
  'auth',
  'navigation',
  'customers',
  'dashboard',
  'settings',
  'forms',
  'tables',
  'errors'
] as const;

// Translation resources
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    customers: enCustomers,
    dashboard: enDashboard,
    settings: enSettings,
    forms: enForms,
    tables: enTables,
    errors: enErrors
  },
  vi: {
    common: viCommon,
    auth: viAuth,
    navigation: viNavigation,
    customers: viCustomers,
    dashboard: viDashboard,
    settings: viSettings,
    forms: viForms,
    tables: viTables,
    errors: viErrors
  }
};

// Initialize i18next
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE,
    defaultNS: 'common',
    ns: NAMESPACES,
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
      excludeCacheFor: ['cimode']
    },

    // Backend options (for loading translations from server if needed)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
      format: (value, format) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);
        return value;
      }
    },

    // React options
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span']
    },

    // Development options
    debug: process.env.NODE_ENV === 'development',
    
    // Key separator and nesting separator
    keySeparator: '.',
    nsSeparator: ':',
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
      }
    }
  });

export default i18n;